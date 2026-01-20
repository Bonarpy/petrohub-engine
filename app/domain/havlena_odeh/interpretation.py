# app/domain/havlena_odeh/interpretation.py

from typing import List
from app.models.havlena_odeh import DriveIndices, DriveMechanismType, RegressionResult
# Kita import dari sumber aslinya (Week 2) agar file ini mengenali tipe datanya
from app.models.material_balance import ProductionDataPoint

def identify_drive_mechanism(
    regression_result: RegressionResult,
    F: List[float],
    Eo: List[float],
    Eg: List[float],
    history: List[ProductionDataPoint],
    input_m: float
) -> DriveIndices:
    """
    [Day 3 Logic]
    Menghitung DDI, SDI, dan WDI secara eksplisit per titik.
    Denominator = Net Expansion = F - (Wp * Bw).
    
    Rumus Pirson:
    DDI = N * Eo / Denominator
    SDI = N * m * Eg / Denominator
    WDI = (We - Wp * Bw) / Denominator
    """
    
    # --- 1. SETUP & VALIDATION ---
    N = regression_result.N
    
    # Jika regresi gagal atau N negatif (fisik tidak mungkin), return UNKNOWN
    if N <= 1e-6:
        return DriveIndices(
            dominant_mechanism=DriveMechanismType.UNKNOWN,
            DDI=0.0, SDI=0.0, WDI=0.0
        )

    # Ambil m (Prioritas: Hasil Regresi > Input User)
    m = regression_result.m if regression_result.m is not None else input_m

    # Akumulator untuk rata-rata
    sum_ddi = 0.0
    sum_sdi = 0.0
    sum_wdi = 0.0
    valid_points = 0

    # =========================================================
    # LOGIC AREA 1: CALCULATE INDEX PER POINT
    # =========================================================
    
    for f_i, eo_i, eg_i, point in zip(F, Eo, Eg, history):
        
        # Hitung Komponen Air Produksi
        water_production_term = point.wp * point.bw
        
        # Denominator = Total Withdrawal (F) - Water Prod (WpBw)
        # Ini merepresentasikan Net Reservoir Expansion (Oil + Gas)
        denominator = f_i - water_production_term
        
        # Skip titik awal atau noise dimana denominator terlalu kecil
        if abs(denominator) < 1e-6:
            continue
            
        # 1. Depletion Drive Index (DDI)
        # Energi dari ekspansi minyak dan gas terlarut
        curr_ddi = (N * eo_i) / denominator
        
        # 2. Segregation Drive Index (SDI)
        # Energi dari ekspansi tudung gas (Gas Cap)
        curr_sdi = (N * m * eg_i) / denominator
        
        # 3. Water Drive Index (WDI) - EKSPLISIT
        # Energi dari rembesan air (We) dikurangi air yang terproduksi
        # Menggunakan point.we (Input Kumulatif Influx)
        curr_wdi = (point.we - water_production_term) / denominator
        
        # Akumulasi
        sum_ddi += curr_ddi
        sum_sdi += curr_sdi
        sum_wdi += curr_wdi
        valid_points += 1

    # =========================================================
    # LOGIC AREA 2: CALCULATE AVERAGE
    # =========================================================
    
    if valid_points > 0:
        avg_ddi = sum_ddi / valid_points
        avg_sdi = sum_sdi / valid_points
        avg_wdi = sum_wdi / valid_points
    else:
        avg_ddi, avg_sdi, avg_wdi = 0.0, 0.0, 0.0

    # =========================================================
    # LOGIC AREA 3: DETERMINE DOMINANT DRIVE
    # =========================================================
    
    dominant = DriveMechanismType.COMBINATION # Default
    
    # Logic Prioritas (Threshold 50%)
    if avg_wdi >= 0.5:
        dominant = DriveMechanismType.WATER_DRIVE
    elif avg_sdi >= 0.5:
        dominant = DriveMechanismType.GAS_CAP
    elif avg_ddi >= 0.5:
        dominant = DriveMechanismType.SOLUTION_GAS
    else:
        dominant = DriveMechanismType.COMBINATION

    # --- RETURN ---
    return DriveIndices(
        dominant_mechanism=dominant,
        DDI=avg_ddi,
        SDI=avg_sdi,
        WDI=avg_wdi
    )