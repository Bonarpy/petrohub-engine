# app/domain/mbal/equations.py

"""
MATERIAL BALANCE EQUATIONS (DOMAIN LAYER)
-----------------------------------------
Source: General Material Balance Equation (Eq 7.1)
Type: Pure Functions (Stateless, Deterministic)

Prinsip:
Fungsi-fungsi ini hanya menerima angka (float) dan mengembalikan angka (float).
Mereka tidak melakukan validasi input (itu tugas Pydantic)
dan tidak melakukan looping (itu tugas Service).
"""

# 1. Suku Kiri (Total Underground Withdrawal - F)
def calculate_F(np: float, bo: float, wp: float, bw: float, gp: float, bg: float, rso: float) -> float:
    """
    Menghitung F (Total Underground Withdrawal).
    F = Np*Bo + Np*(Rp - Rso)*Bg + Wp*Bw = Np*Bo + (Gp - Np*Rso)*Bg + Wp*Bw
    
    Logic:
    Kita harus mengurangi gas yang terlarut (Np*Rso) dari total gas produksi (Gp)
    untuk mendapatkan volume Free Gas yang sebenarnya terekspansi.
    """
    # Menghitung volume gas bebas yang terproduksi
    # Gp = Total Gas, Np*Rso = Gas yang harusnya terlarut di minyak pada tekanan P
    free_gas_produced = gp - (np * rso)
    
    # Defensive Coding: Secara fisik free gas tidak mungkin negatif. 
    # (Kalau Gp < Np*Rso berarti data GOR aneh/salah input, tapi kita biarkan math bekerja dulu atau bisa di-nol-kan)
    # if free_gas_produced < 0: free_gas_produced = 0 
    
    return (np * bo) + (free_gas_produced * bg) + (wp * bw)

# 2. Suku Kanan Bagian 1 (Oil & Dissolved Gas Expansion - Eo)
def calculate_Eo(bo: float, boi: float, rsoi: float, rso: float, bg: float)-> float:
    """
    Menghitung Eo (Expansion of Oil + Dissolved Gas).
    Rumus: Eo = (Bo - Boi) + (Rsoi - Rso) * Bg
    """
    # Breakdown rumus biar mudah dibaca:
    oil_expansion = bo -boi
    gas_release_expansion = (rsoi -rso)*bg
    return oil_expansion + gas_release_expansion

# 3. Suku Kanan Bagian 2 (Gas Cap Expansion - Eg)
def calculate_Eg(boi: float, bg: float, bgi: float) -> float:
    """
    Menghitung Eg (Expansion of Gas Cap).
    Rumus Dasar Expansion Factor: Eg = Boi * ((Bg/Bgi) - 1)
    
    Catatan: Variable 'm' dan 'N' tidak dihitung di sini.
    Fungsi ini hanya menghitung 'Berapa kali lipat gas cap mengembang'.
    Nanti di Service/Regresi baru dikali dengan (m * N).
    """
    if bgi == 0: return 0.0 # Hindari pembagian dengan nol
    
    return boi * ((bg / bgi) - 1)

# 4. Suku Kanan Bagian 3 (Formation & Water Expansion - Efw)
def calculate_Efw(boi: float, cf: float, cw: float, swc: float, delta_p: float) -> float:
    """
    Menghitung Efw (Expansion of Pore & Connate Water).
    Rumus Expansion Factor: Efw = Boi * [ (cw*Swc + cf) / (1-Swc) ] * DeltaP
    
    Catatan: Variable '(1+m) * N' dikalikan di luar.
    """
    if swc >= 1.0: return 0.0 # Mustahil Swc 100% (batu isinya air semua)
    
    compressibility_term = (cw * swc + cf) / (1 - swc)
    return boi * compressibility_term * delta_p

