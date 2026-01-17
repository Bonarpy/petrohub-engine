# app/api/material_balance.py

from fastapi import APIRouter, HTTPException 
# Import Formulir (Step 1)
from app.models.material_balance import MaterialBalanceRequest, MaterialBalanceResponse 
# Import Otak/Service (Step 2) -> Kita kasih nama alias 'service' biar singkat
from app.services import material_balance as service

# Kita buat Router
router = APIRouter()


# Definisi URL : POST ke/calculate
@router.post("/calculate",response_model=MaterialBalanceResponse)

def compute_mbal(request: MaterialBalanceRequest):
    """
    Endpoint ini menerima data Material Balance,
    melemparnya ke Service untuk dihitung,
    lalu mengembalikan hasilnya ke user .
    """
    try:
        result = service.calculate_material_balance(request)
        return result
    except Exception as e:
        # Kalau ada apa-apa, kasih tau user errornya (Code 500)
        raise HTTPException(status_code=500, detail=str(e))