# app/domain/havlena-odeh/transformation.py

from app.models.material_balance import ReservoirAssumption
# IMPORT DARI WEEK 2 (Reuse Logic)
from app.domain.mbal.equations import (
    calculate_F,
    calculate_Eo,
    calculate_Eg,
    calculate_Efw
)

def calculate_single_step(
    p: float, p_i: float,
    np: float, gp: float, wp: float,
    bo: float, boi: float,
    bg: float, bgi: float,
    rso: float, rsoi: float,
    bw: float,
    cw: float, cf: float, swc: float,
    we: float,
    assumptions: list[ReservoirAssumption]
) -> dict:
    """
    [Week 3 Wrapper]
    Menghitung komponen Havlena-Odeh untuk SATU titik data
    dengan meminjam rumus fisika dari Week 2.
    """
    
    # 1. Hitung F (Total Withdrawal) via Week 2 Equation
    val_F = calculate_F(np=np, bo=bo, wp=wp, bw=bw, gp=gp, bg=bg, rso=rso)

    # 2. Hitung Eo (Oil Expansion) via Week 2 Equation
    val_Eo = calculate_Eo(bo=bo, boi=boi, rsoi=rsoi, rso=rso, bg=bg)

    # 3. Hitung Eg (Gas Expansion) via Week 2 Equation
    val_Eg = calculate_Eg(boi=boi, bg=bg, bgi=bgi)

    # 4. Hitung Efw (Formation Water Expansion) via Week 2 Equation
    # Butuh Delta P
    delta_p = p_i - p
    val_Efw = calculate_Efw(boi=boi, cf=cf, cw=cw, swc=swc, delta_p=delta_p)

    # 5. Hitung We (Water Influx) - Logic Asumsi Week 3
    if ReservoirAssumption.VOLUMETRIC in assumptions:
        val_We = 0.0
    else:
        val_We = we

    # Return Raw Components (Belum dikali m atau N)
    return {
        "F": val_F,
        "Eo": val_Eo,
        "Eg": val_Eg,
        "Efw": val_Efw, 
        "We": val_We
    }