from pydantic import BaseModel, Field
from typing import Literal

# --- 1. INPUT ---
class GasFullRequest(BaseModel):
    # --- A. Data Utama ---
    # Tekanan (Pressure) wajib > 0
    pressure: float = Field(..., gt=0, lt=20000, description="Pressure (psia)")
    
    # Suhu (Temperature) wajib > 0
    temperature: float = Field(..., gt=0, lt=500, description="Temperature (Fahrenheit)")
    
    # Specific Gravity (misal 0.5 - 1.5)
    gas_gravity: float = Field(..., ge=0.5, le=1.5, description="Gas Specific Gravity")
    
    # --- B. Impurities ---
    # Default 0 jika user tidak isi. Satuannya Persen (%).
    n2: float = Field(0.0, ge=0, le=100, description="Nitrogen (%)")
    co2: float = Field(0.0, ge=0, le=100, description="Carbon Dioxide (%)")
    h2s: float = Field(0.0, ge=0, le=100, description="Hydrogen Sulfide (%)")
    
    # --- C. Pilihan Metode (Dropdown) ---
    # User harus memilih salah satu korelasi di dalam kurung siku.
    
    # Korelasi hitung Pseudo-Critical (Sutton)
    ppc_method: Literal["Natural Gas", "Gas Condensate"] = "Natural Gas"
    
    # Korelasi Koreksi Impurities
    correction_method: Literal["Wichert-Aziz", "Carr-Kobayashi-Burrows"] = "Wichert-Aziz"
    
    # Korelasi Z-Factor
    z_method: Literal["DAK", "Hall-Yarborough"] = "DAK"
    
    # Korelasi Viskositas
    viscosity_method: Literal["Lee-Gonzalez-Eakin", "Carr-Kobayashi-Burrows"] = "Lee-Gonzalez-Eakin"


# --- 2. OUTPUT ---
# Ini daftar semua variabel yang ditampilkan di layar nanti
class GasProperties(BaseModel):
    tpc: float              # Pseudo-critical Temp
    ppc: float              # Pseudo-critical Pressure
    z_factor: float         # Faktor Z
    bg: float               # Formation Volume Factor
    density: float          # Densitas
    compressibility: float  # Kompresibilitas (Cg)
    viscosity: float        # Viskositas (ug)


# --- 3. RESPONSE FINAL ---
class GasFullResponse(BaseModel):
    status: str             # "success" atau "error"
    inputs: dict            # Kita balikin inputnya biar user bisa cek
    results: GasProperties  # Hasil hitungan dimasukkan ke sini