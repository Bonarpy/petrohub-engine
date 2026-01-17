# app/domain/mbal/exceptions.py

"""
DOMAIN EXCEPTIONS
-----------------
Daftar error spesifik untuk domain Material Balance.
File ini memastikan error yang keluar punya makna 'Engineering',
bukan sekadar error Python biasa.
"""

class MbalDomainError(Exception):
    """Base class untuk semua error di domain MBAL"""
    pass

class PhysicalConstraintError(MbalDomainError):
    """
    Error ini muncul jika input melanggar hukum fisika dasar.
    Contoh :
    - Tekanan negatif
    - Saturasi > 1.0
    - Formation Volume Factor (Bo/Bg) <=0
    """

    def __init__(self, message: str, field: str = None, value: float = None):
        self.field = field
        self.value = value
        super().__init__(message)

class EngineeringConsistencyError(MbalDomainError):
    """
    Error ini muncul jika input valid secara angka, tapi tidak masuk akal
    secara engineering logic / asumsi reservoir.
    
    Contoh:
    - Input P < Pb, tapi user bilang ini "Undersaturated Oil" (m=0).
    - User input Water Influx tapi aquifer model dimatikan.
    """
    pass

class DataLengthMismatchError(MbalDomainError):
    """
    Error jika panjang array data produksi tidak konsisten.
    Contoh:
    - Array Pressure ada 10 titik, tapi Array Np cuma 5 titik.
    """
    pass