#app/models/material_balance.py

from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum

# --- [BARU] BAGIAN 0: MENU PILIHAN (DROPDOWN) ---
# Ini daftar asumsi yang bisa dipilih user supaya software kita 'Smart'
class ReservoirAssumption(str, Enum):
    GENERAL = "general"                       # Default (Hitung Semua)
    NO_GAS_CAP = "no_gas_cap"                 # Asumsi m=0, Eg=0
    VOLUMETRIC = "volumetric"                 # Asumsi We=0 (Tertutup)
    NO_COMPRESSIBILITY = "no_compressibility" # Asumsi Efw=0 (Batuan keras)
    UNDERSATURATED = "undersaturated"         # P > Pb (Single Phase Oil)

# --- BAGIAN 1: DATA DINAMIS (Berubah seiring waktu) ---
# Ini merepresentasikan SATU BARIS data di tabel produksi kamu.

class ProductionDataPoint(BaseModel):
    # Field(..., gt=0) artinya: Wajib diisi (...) dan harus lebih besar dari 0 (gt=0)
    pressure : float = Field(..., gt=0,description="Current Reservoir Pressure (psi)")

    # Cumulative Production (Np) gak boleh negatif (ge=0 / greater or equal 0)
    np : float = Field(..., ge=0, description="Cumulative Oil Production (STB)")
    wp: float = Field(0, ge=0, description="Cumulative Water Production (STB)")
    gp: float = Field(0, ge=0, description="Cumulative Gas Production (scf)")

    # PVT Properties pada tekanan saat ini (Current P)
    # Nanti di Week 3/4 bisa kita bikin ini otomatis, tapi skrg manual dulu
    bo : float = Field(..., gt=0, description="Oil FVF (rb/STB)")
    bg : float = Field(..., gt=0, description="Gas FVF (rb/scf)")
    rso : float = Field(..., ge=0, description="Solution GOR (scf/STB)")
    bw : float = Field(..., gt=0, description="Water FVF (rb/STB)")
    we : float = Field(0, ge=0, description="Cumulative Water Influx (bbl)")


# --- BAGIAN 2: DATA STATIS (Konstanta Reservoir) ---
# Ini data awal yang nilainya tetap (Initial Conditions)
class ReservoirProperties(BaseModel):
    pi: float = Field(..., gt=0, description="Initial Reservoir Pressure (psi)")
    pb: float = Field(..., gt=0, description="Bubble Point Pressure (psi)")
    boi: float = Field(..., gt=0, description="Initial Oil FVF (rb/STB)")
    bgi: float = Field(..., gt=0, description="Initial Gas FVF (rb/scf)")
    rsoi: float = Field(..., ge=0, description="Initial Solution GOR (scf/STB)")
    
    # Drive Mechanisms (m = Gas Cap Ratio)
    m: float = Field(0, ge=0, description="Gas Cap Ratio (m)")
    
    # Compressibility (Batu & Air)
    cw: float = Field(0, ge=0, description="Water Compressibility (1/psi)")
    cf: float = Field(0, ge=0, description="Formation Compressibility (1/psi)")
    swc: float = Field(0, ge=0, le=1, description="Connate Water Saturation (Fraction)")

# --- BAGIAN 3: WRAPPER (Bungkus Utama) ---
# Inilah "Kontrak Utama" yang akan dikirim user.
# User kirim 1 objek properti, dan 1 LIST (Array) data produksi.

class MaterialBalanceRequest(BaseModel):
    reservoir : ReservoirProperties
    production_history :List[ProductionDataPoint]
    assumptions: List[ReservoirAssumption] = []

# --- BAGIAN 4: OUTPUT (Hasil Hitungan) ---
# Kita siapkan tempat untuk menyimpan hasil F, Eo, Eg per titik tekanan
class MaterialBalanceResult(BaseModel):
    pressure: float
    f_term : float
    eo_term : float
    eg_term : float
    efw_term : float
    we_term : float
    x_axis: float = Field(..., description="Total Expansion (X Axis)")
    y_axis: float = Field(..., description="Net Withdrawal (Y Axis)")
    calculated_n: Optional[float] = Field(None, description="Estimated IOIP (STB) using Single Point Calc (Y/X)")

# Bungkus hasil akhirnya
class MaterialBalanceResponse(BaseModel):
    status: str
    results: List[MaterialBalanceResult]
    message: str
