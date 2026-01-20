# app/api/havlena_odeh.py

from fastapi import APIRouter, HTTPException
from app.models.havlena_odeh import HavlenaOdehInput, HavlenaOdehResponse
from app.services.havlena_odeh import process_havlena_odeh_data

# Inisialisasi Router
router = APIRouter()

@router.post("/calculate", response_model=HavlenaOdehResponse)
async def calculate_havlena_odeh(data: HavlenaOdehInput):
    """
    Endpoint utama untuk analisis Havlena-Odeh.
    Flow: Input -> Transformasi -> Regresi -> Interpretasi -> Output
    """
    # =========================================================
    # LOGIC AREA (70% ANDA)
    # =========================================================
    # Tugas:
    # 1. Panggil `process_havlena_odeh_data(data)`.
    # 2. Bungkus dalam try-except block.
    # 3. Jika sukses, return result.
    # 4. Jika catch ValueError (misal data < 3 titik), raise HTTPException 400.
    # 5. Jika error lain, raise HTTPException 500.
    
    try:
        result = process_havlena_odeh_data(data)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Calculation Error:{str(e)}")
