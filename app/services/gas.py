# app/services/gas.py
import math

# --- 1. PSEUDO-CRITICAL (Sutton) ---
def calc_pseudo_critical(sg, method):
    if method == "Natural Gas":
        Tpc = 168 + 325 * sg - 12.5 * (sg**2)
        Ppc = 677 + 15.0 * sg - 37.5 * (sg**2)
    else: # Gas Condensate
        Tpc = 187 + 330 * sg - 71.5 * (sg**2)
        Ppc = 706 + 51.7 * sg - 11.1 * (sg**2)
    return Tpc, Ppc

# --- 2. CORRECTION (Impurities) ---
def calc_correction(Tpc, Ppc, h2s, co2, n2, method):
    # Input h2s, co2, n2 dalam persen (0-100)
    if method == "Wichert-Aziz":
        A = (h2s/100) + (co2/100)
        B = (h2s/100)
        # Rumus Wichert-Aziz Epsilon
        ep = 120 * (A**0.9 - A**1.6) + 15 * (B**0.5 - B**4)
        
        Tpc_corr = Tpc - ep
        if (Tpc + B * (1 - B) * ep) != 0:
            Ppc_corr = (Ppc * Tpc_corr) / (Tpc + B * (1 - B) * ep)
        else:
            Ppc_corr = Ppc # Fallback jika pembagi nol
            
    else: # Carr-Kobayashi-Burrows Correction
        Tpc_corr = Tpc - 80*(co2/100) + 130*(h2s/100) - 250*(n2/100)
        Ppc_corr = Ppc + 440*(co2/100) + 600*(h2s/100) - 170*(n2/100)
        
    return Tpc_corr, Ppc_corr

# --- 3. Z-FACTOR (UPDATED DENGAN FILTER COMPLEX) ---
def calc_z_factor(P, T, Ppc, Tpc, method):
    # T dan Tpc harus dalam Rankine
    Ppr = P / Ppc
    Tpr = T / Tpc
    
    z = 1.0 # Default value jika fail

    if method == "DAK":
        # Dranchuk-Abou-Kassem Constants
        A = [0.3265, -1.0700, -0.5339, 0.01569, -0.05165, 0.5475, -0.7361, 0.1844, 0.1056, 0.6134, 0.7210]
        R1 = A[0] + (A[1]/Tpr) + ((A[2])/Tpr**3) + ((A[3])/Tpr**4) + ((A[4])/Tpr**5)
        R2 = (0.27*Ppr)/Tpr
        R3 = A[5] + (A[6]/Tpr) + (A[7]/(Tpr**2))
        R4 = A[8]*((A[6]/Tpr) + (A[7]/(Tpr**2)))
        R5 = A[9]/(Tpr**3)
        
        rho_r = 0.27 * Ppr / Tpr # Initial guess
        for _ in range(50):
            # Hitung f dan df (turunan)
            f = R1*rho_r - (R2/rho_r) + (R3*(rho_r**2)) - (R4*(rho_r**5)) + (R5*(1+(A[10])*(rho_r**2)))*(math.exp(-(A[10])*(rho_r**2))) + 1
            df = R1 + (R2/(rho_r**2)) + (2*R3*rho_r) - (5*R4*(rho_r**4)) -(2*R5*(A[10]**2)*(rho_r**3)*math.exp(-A[10]*rho_r**2))
            
            if abs(df) < 1e-6: break 
            new_rho_r = rho_r - (f/df)
            
            if abs(new_rho_r - rho_r) < 0.0001:
                rho_r = new_rho_r
                break
            rho_r = new_rho_r
        
        z = (0.27 * Ppr) / (rho_r * Tpr)
        
    else: 
        # Hall-Yarborough
        t = 1 / Tpr 
        A = 0.06125 * Ppr * t * math.exp(-1.2 * (1 - t)**2)
        
        Y = 0.001 # Initial guess
        for _ in range(50):
            # Persamaan Hall-Yarborough
            X1 = -0.06125 * Ppr * t * math.exp(-1.2 * (1 - t)**2)
            X2 = (14.76 * t - 9.76 * t**2 + 4.58 * t**3)
            X3 = (90.7 * t - 242.2 * t**2 + 42.4 * t**3)
            X4 = (2.18 + 2.82 * t)
            
            numerator = X1 + (Y + Y**2 + Y**3 + Y**4)/((1-Y)**3) - X2*Y**2 + X3*(Y**X4)
            denominator = ((1-Y)**3 * (1 + 2*Y + 3*Y**2 + 4*Y**3) + 3*(Y + Y**2 + Y**3 + Y**4)*(1-Y)**2)/((1-Y)**6) - 2*X2*Y + X3*X4*(Y**(X4-1))
            
            if abs(denominator) < 1e-6: break
            new_Y = Y - (numerator/denominator)
            if abs(new_Y - Y) < 0.00001:
                Y = new_Y
                break
            Y = new_Y

        if Y != 0:
            z = (A / Y)
        else:
            z = 1.0

    # --- BAGIAN PENYELAMAT (FILTER COMPLEX) ---
    # Ini wajib ada untuk membuang bagian imajiner (j)
    if isinstance(z, complex):
        z = z.real
        
    return float(z)

# --- 4. VISCOSITY ---
def calc_viscosity(P, T, sg, z, Ppc, Tpc, co2, h2s, n2, method):
    # SAFETY: Kalau Z error/nol, return 0 biar gak crash
    if z <= 0.0001: return 0.0

    # T disini diasumsikan sudah Rankine (dari orchestrator)
    # Tapi CKB butuh Fahrenheit, LGE butuh Rankine.
    
    if method == "Carr-Kobayashi-Burrows":
        T_F = T - 460 # Balikin ke Fahrenheit
        
        # Rumus dasar CKB
        u1_uncorrected = (1.709*((10**(-5))-2.062*(10**(-6))*sg))*(T_F)+8.118*(10**(-3))-6.15*(10**(-3))*math.log10(sg)
        
        # Koreksi Impurities
        u_corr = u1_uncorrected + (co2/100)*((9.08e-3)*math.log10(sg)+6.24e-3) + (n2/100)*(8.48e-3*math.log10(sg)+9.59e-3) + (h2s/100)*(8.49e-2*math.log10(sg)+3.73e-2)
        
        Ppr = P / Ppc
        Tpr = T / Tpc
        
        # Koefisien Dempsey (Adjustment Pressure)
        A0=-2.46211820; A1=2.970547414; A2=-0.286264054; A3=0.00805420522
        B0=2.80860949; B1=-3.49803305; B2=0.360373020; B3=-0.01044324
        C0=-0.793385648; C1=1.39643306; C2=-0.149144925; C3=0.00441015512
        D0=0.0839387178; D1=-0.186408848; D2=-0.0203367881; D3=-0.000609579263
        
        term = (A0 + A1*Ppr + A2*Ppr**2 + A3*Ppr**3) + \
               Tpr*(B0 + B1*Ppr + B2*Ppr**2 + B3*Ppr**3) + \
               Tpr**2*(C0 + C1*Ppr + C2*Ppr**2 + C3*Ppr**3) + \
               Tpr**3*(D0 + D1*Ppr + D2*Ppr**2 + D3*Ppr**3)
               
        try:
            ug = (u_corr / Tpr) * math.exp(term)
        except OverflowError:
            ug = 0.0 # Kalau angkanya terlalu besar (safety)
            
        return ug

    else: # Lee-Gonzalez-Eakin
        # Butuh R = 10.73 untuk English Unit
        M = sg * 28.964
        rho_g = (P * M) / (10.73 * T * z) # Density lb/ft3
        
        X = 3.5 + (986/T) + 0.01*M
        Y = 2.4 - 0.2*X
        K = ((9.4 + 0.02*M) * T**1.5) / (209 + 19*M + T)
        
        ug = 10**(-4) * K * math.exp(X * (rho_g/62.4)**Y)
        return ug


# --- 5. COMPRESSIBILITY (SAFE VERSION) ---
def calc_compressibility(P, T, Ppc, Tpc, z):
    # SAFETY: Kalau Z nol, hitungan di bawah pasti error (dibagi nol)
    if z <= 0.0001 or Ppc <= 0: return 0.0

    Ppr = P / Ppc
    Tpr = T / Tpc
    rho_r = 0.27 * Ppr / (z * Tpr)
    
    # Konstanta Mattar-Brar-Aziz
    A1=0.31506; A2=-1.0467; A3=-0.57833; A4=0.5353
    A5=-0.6123; A6=-0.10489; A7=0.68157; A8=0.68447
    
    # Derivative Approximation
    cz = A1 + A2/Tpr + A3/Tpr**3 + A4/Tpr**4 + A5/Tpr**5
    
    # SAFETY: Pastikan penyebut tidak nol
    denominator = z**2 * Tpr
    if denominator == 0: return 0.0

    c_pr = (1/Ppr) - (0.27/denominator) * (cz * rho_r) 
    
    cg = c_pr / Ppc 
    return abs(cg) # Pastikan positif

# === ORCHESTRATOR UTAMA ===
def calculate_gas_full(data):
    # 1. Ambil data dari input models
    P = data.pressure
    T_F = data.temperature
    T_R = T_F + 460
    sg = data.gas_gravity
    
    # 2. Hitung Pseudo-Critical
    Tpc_raw, Ppc_raw = calc_pseudo_critical(sg, data.ppc_method)
    
    # 3. Koreksi Impurities (H2S, CO2, N2)
    Tpc, Ppc = calc_correction(Tpc_raw, Ppc_raw, data.h2s, data.co2, data.n2, data.correction_method)
    
    # 4. Hitung Z-Factor
    z = calc_z_factor(P, T_R, Ppc, Tpc, data.z_method)
    
    # 5. Hitung Properties Lain
    bg = 0.02827 * z * T_R / P
    density = (2.7 * sg * P) / (z * T_R)
    cg = calc_compressibility(P, T_R, Ppc, Tpc, z)
    ug = calc_viscosity(P, T_R, sg, z, Ppc, Tpc, data.co2, data.h2s, data.n2, data.viscosity_method)
    
    return {
        "tpc": Tpc,
        "ppc": Ppc,
        "z_factor": z,
        "bg": bg,
        "density": density,
        "compressibility": cg,
        "viscosity": ug
    }