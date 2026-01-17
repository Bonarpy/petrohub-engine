# app/services/material_balance.py

from app.models.material_balance import (
    MaterialBalanceRequest, 
    MaterialBalanceResponse, 
    MaterialBalanceResult, 
    ReservoirAssumption
)
# [UBAH 1] Import linearization
from app.domain.mbal import equations, validators, linearization

def calculate_material_balance(request: MaterialBalanceRequest) -> MaterialBalanceResponse:
    """
    Core Service MBAL dengan fitur 'Smart Assumptions' & 'Linearization'.
    """
    res = request.reservoir
    history = request.production_history
    assumptions = request.assumptions
    
    results = []

    for point in history:
        
        # --- 1. VALIDASI ---
        validators.validate_pressure_consistency(pi=res.pi, current_p=point.pressure)
        validators.validate_pvt_consistency(p=point.pressure, pb=res.pb, rso=point.rso, rsoi=res.rsoi)

        # --- 2. LOGIKA SAKLAR (Assumptions Logic) ---

        # A. Hitung Eo
        if ReservoirAssumption.UNDERSATURATED in assumptions:
            eo_val = point.bo - res.boi
        else:
            eo_val = equations.calculate_Eo(
                bo=point.bo, boi=res.boi, 
                rsoi=res.rsoi, rso=point.rso, bg=point.bg
            )

        # B. Hitung Eg
        if (ReservoirAssumption.NO_GAS_CAP in assumptions) or \
           (ReservoirAssumption.UNDERSATURATED in assumptions):
            eg_val = 0.0
        else:
            eg_val = equations.calculate_Eg(boi=res.boi, bg=point.bg, bgi=res.bgi)

        # C. Hitung Efw
        if ReservoirAssumption.NO_COMPRESSIBILITY in assumptions:
            efw_val = 0.0
        else:
            delta_p = res.pi - point.pressure
            efw_val = equations.calculate_Efw(
                boi=res.boi, cf=res.cf, cw=res.cw, 
                swc=res.swc, delta_p=delta_p
            )

        # D. Hitung We
        if ReservoirAssumption.VOLUMETRIC in assumptions:
            we_val = 0.0
        else:
            we_val = point.we

        # E. Hitung F
        f_val = equations.calculate_F(
            np=point.np, bo=point.bo, wp=point.wp, 
            bw=point.bw, gp=point.gp, bg=point.bg, rso=point.rso
        )

        # --- [UBAH 2] 3. LINEARISASI (Baru) ---
        # Menghitung koordinat Havlena-Odeh (X dan Y)
        # X = Total Expansion
        # Y = Net Withdrawal
        
        x_axis_val = linearization.calculate_x_axis(
            eo=eo_val,
            eg=eg_val,
            efw=efw_val,
            m=res.m,
            assumptions=assumptions
        )

        y_axis_val = linearization.calculate_y_axis(
            f=f_val,
            we=we_val,
            assumptions=assumptions
        )

        # [DEBUG CCTV] Lihat angka hasil hitungan Domain
        print(f"   > Eo: {eo_val:.5f}, Eg: {eg_val:.5f}, Efw: {efw_val:.5f}")
        print(f"   > X (Expansion): {x_axis_val:.6f}")
        print(f"   > Y (Withdrawal): {y_axis_val:.2f}")

        # --- SAFETY CHECK (Anti Error 500) ---
        if abs(x_axis_val) < 1e-9: 
            print("   ⚠️ X mendekati 0. Set N = 0 untuk mencegah crash.")
            n_val = 0.0 
        else:
            n_val = y_axis_val / x_axis_val
            print(f"   ✅ N Calculated: {n_val:,.0f} STB")

        # --- [UBAH 3] 4. BUNGKUS HASIL ---
        results.append(MaterialBalanceResult(
            pressure=point.pressure,
            f_term=f_val,
            eo_term=eo_val,
            eg_term=eg_val,
            efw_term=efw_val,
            we_term=we_val,
            # Field baru untuk grafik & hitung IOIP
            x_axis=x_axis_val, 
            y_axis=y_axis_val,
            # [BARU] Hasil Akhir Week 2
            calculated_n=n_val
        ))

    return MaterialBalanceResponse(
        status="success",
        results=results,
        message=f"Calculation completed. Assumptions used: {[a.value for a in assumptions]}"
    )