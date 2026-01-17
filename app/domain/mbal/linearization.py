from typing import List
from app.models.material_balance import ReservoirAssumption

def calculate_x_axis(
    eo: float, 
    eg: float, 
    efw: float, 
    m: float, 
    assumptions: List[ReservoirAssumption]
) -> float:
    """
    Menghitung Sumbu X (Total Expansion)
    Rumus X = Eo + mEg + Efw*(1+m)
    """
    # 1. Cek Asumsi Gas Cap (Untuk nilai m)
    if (ReservoirAssumption.NO_GAS_CAP in assumptions) or \
       (ReservoirAssumption.UNDERSATURATED in assumptions):
        effective_m = 0.0
    else:
        effective_m = m

    # 2. Term Gas (m * Eg)
    term_gas = effective_m * eg
        
    # 3. Term Compressibility (Efw * (1+m)) -> INI YANG PENTING
    if ReservoirAssumption.NO_COMPRESSIBILITY in assumptions:
        term_compressibility = 0.0
    else:
        term_compressibility = efw * (1 + effective_m)
        
    # 4. Total Expansion
    return eo + term_gas + term_compressibility

def calculate_y_axis(
    f: float, 
    we: float, 
    assumptions: List[ReservoirAssumption]
) -> float:
    """
    Menghitung Sumbu Y (Net Withdrawal).
    Rumus: Y = F - We
    """
    if ReservoirAssumption.VOLUMETRIC in assumptions:
        influx = 0.0
    else:
        influx = we
        
    return f - influx