# app/domain/mbal/validators.py

from app.domain.mbal.exceptions import EngineeringConsistencyError

"""
VALIDATORS (THE LOGIC KEEPER)
-----------------------------
Fokus pada 'Cross-Field Validation' dan 'Business Logic'
yang tidak bisa ditangani oleh Pydantic (Basic Type Checking).
"""

def validate_pressure_consistency(pi: float, current_p: float):
    """
    Cek Logic 1: Tekanan Reservoir
    Dalam kasus standar, P sekarang tidak mungkin lebih besar dari Pi
    (kecuali ada injeksi, yang belum kita handle).
    """
    if current_p > pi:
        raise EngineeringConsistencyError(
            message=f"Current pressure ({current_p} psi) > Initial Pressure ({pi} psi). Injection not supported.",
            field="pressure",
            value=current_p
        )

def validate_pvt_consistency(p: float, pb: float, rso: float, rsoi: float):
    """
    Cek Logic 2: PVT Behavior (Undersaturated vs Saturated)
    
    Hukum Fisika:
    1. Jika P > Pb (Undersaturated), maka gas belum keluar dari minyak.
       Artinya: Rso HARUS SAMA DENGAN Rsoi.
       
    Pydantic gak bisa ngecek ini karena dia gak tau hubungan P dan Rs.
    """
    # Kita kasih toleransi dikit (float precision)
    tolerance = 0.1 
    
    is_undersaturated = p > pb
    
    if is_undersaturated:
        # Cek apakah Rs menyimpang dari Rsoi?
        if abs(rso - rsoi) > tolerance:
            raise EngineeringConsistencyError(
                message=f"Physics Violation: At P ({p}) > Pb ({pb}), Oil is Undersaturated. "
                        f"Current Rs ({rso}) must equal Initial Rsoi ({rsoi}).",
                field="rso",
                value=rso
            )