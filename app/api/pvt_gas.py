from fastapi import APIRouter, HTTPException
from app.models.pvt_models import GasFullRequest, GasFullResponse
from app.services.gas import calculate_gas_full

router = APIRouter()

# Endpoint 
@router.post("/full", response_model=GasFullResponse)
def calculate_gas(data: GasFullRequest):
    try:
        # 1. Panggil Orchestrator di Service (Dapur) atau tempat dimana data diproses
        results = calculate_gas_full(data)
        
        # 2. Kembalikan paket sesuai janji di GasFullResponse
        return {
            "status": "success",
            "inputs": data.dict(), # Kita lampirkan input user sebagai bukti
            "results": results     # Hasil hitungan
        }
        
    except Exception as e:
        # Kalau ada error tak terduga, lapor Error 500
        raise HTTPException(status_code=500, detail=str(e))