# app/models/havlena_odeh.py

from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict
from enum import Enum

# --- IMPORT DARI WEEK 2 (REUSE) ---
# Menggunakan struktur data yang sudah ada agar konsisten
from app.models.material_balance import (
    ProductionDataPoint, 
    ReservoirProperties, 
    ReservoirAssumption
)

# ==========================================
# 1. DEFINISI SKENARIO REGRESI (The Strategy)
# ==========================================
class HavlenaOdehScenario(str, Enum):
    """
    Pilihan strategi plot untuk menentukan variabel apa yang dicari.
    """
    # Opsi 1: F = N*Eo + We (Intercept=We, Slope=N)
    # Cocok untuk: Reservoir Volumetric atau Water Drive known
    SCENARIO_1 = "F vs Eo"             

    # Opsi 2: F = N(Eo + mEg) + We (Intercept=We, Slope=N)
    # Cocok untuk: Gas Cap + Water Drive (m diketahui dari input)
    SCENARIO_2 = "F vs (Eo + mEg)"     

    # Opsi 3: F/Eo = N + N*m(Eg/Eo) (Slope=N*m, Intercept=N)
    # Cocok untuk: Mencari m (Gas Cap unknown)
    SCENARIO_3 = "F/Eo vs Eg/Eo"       

    # Opsi 4: F = N(Et) (Intercept harusnya 0, Slope=N)
    # Cocok untuk: General Check (Total Expansion)
    SCENARIO_4 = "F vs Total Expansion"

# ==========================================
# 2. DEFINISI DRIVE INDEX 
# ==========================================
class DriveMechanismType(str, Enum):
    SOLUTION_GAS = "Solution Gas Drive"      # Dominan DDI
    GAS_CAP = "Gas Cap Drive"                # Dominan SDI
    WATER_DRIVE = "Water Drive"              # Dominan WDI
    COMBINATION = "Combination Drive"        # Campuran
    UNKNOWN = "Unknown/Insufficient Data"

# ==========================================
# 3. DEFINISI INPUT HAVLENA-ODEH
# ==========================================
class HavlenaOdehInput(BaseModel):
    # Data Produksi (Time Series)
    history: List[ProductionDataPoint] = Field(..., description="Production history list")
    
    # Konstanta Reservoir (Pi, m, dll)
    properties: ReservoirProperties = Field(..., description="Reservoir constants")
    
    # Setting Asumsi Fisika (No Gas Cap, Volumetric, dll)
    assumptions: List[ReservoirAssumption] = Field(..., description="Active assumptions")
    
    # [PENTING] User harus milih strategi regresi
    scenario: HavlenaOdehScenario = Field(..., description="Selected regression strategy")

    # VALIDATOR: Safety Check minimal 3 titik data untuk statistik
    @field_validator('history')
    def check_min_data_points(cls, v):
        if len(v) < 3:
            raise ValueError("Havlena-Odeh analysis requires at least 3 data points for regression.")
        return v
    
# ==========================================
# 4. DEFINISI OUTPUT REGRESSI
# ==========================================

class RegressionResult(BaseModel):
    """Hasil Matematika & Fisika dari Backend"""
    # Statistik Regresi
    slope: float
    intercept: float
    r_squared: float
    
    # Interpretasi Fisika (Output Akhir)
    # Optional karena tergantung Skenario mana yang dipakai
    N: float = Field(..., description="Original Oil In Place (STB)")
    m: Optional[float] = Field(None, description="Calculated Gas Cap Ratio (if solved via regression)")
    We: Optional[float] = Field(None, description="Calculated Water Influx Constant (if solved)")

# ==========================================
# 5. DEFINISI OUTPUT DRIVE INDEX
# ==========================================

class DriveIndices(BaseModel):
    """
    [REVISI ANDA]
    Menampilkan 4 Hasil Utama Index Reservoir.
    """
    # 1. String Dominant Drive (Otomatis dari Enum ke String di JSON)
    dominant_mechanism: DriveMechanismType = Field(..., description="Main drive mechanism name")
    
    # 2. Float Values (Proporsi Energi)
    DDI: float = Field(..., description="Depletion Drive Index (Solution Gas)")
    SDI: float = Field(..., description="Segregation Drive Index (Gas Cap)")
    WDI: float = Field(..., description="Water Drive Index (Aquifer)")

# ==========================================
# 6. MODEL RESPONSE JSON
# ==========================================

class HavlenaOdehResponse(BaseModel):
    """Response lengkap untuk React"""
    
    # A. Data Visualisasi (Chart)
    x_points: List[float]
    y_points: List[float]
    regression_line: List[float]
    
    # B. Hasil Regresi (N, m, Slope, R2)
    results: RegressionResult
    
    # C. Hasil Drive Index (DDI, SDI, WDI, Dominant Str)
    # Optional: Karena baru muncul setelah regresi sukses & N ditemukan
    drive_indices: Optional[DriveIndices] = Field(None, description="Reservoir drive mechanism analysis")
    
    # D. Data Audit (Raw Terms)
    F: List[float]
    Eo: List[float]
    Eg: List[float]
    Efw: List[float]
    We: List[float]
    pressure: List[float]




