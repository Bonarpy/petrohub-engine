# from fastapi import FastAPI
# from api import pvt_gas  # 1. Panggil Kepala Divisi Gas yang baru kita buat

# app = FastAPI(title="Petroleum Engineering Software - Day 3 Final")

# # 2. Sambungkan Divisi Gas ke Sistem Utama
# app.include_router(pvt_gas.router)

# # Endpoint Health Check (Tetap dipegang GM karena ini info umum)
# @app.get("/health")
# def health():
#     return {"status": "ok", "server": "online"}

# @app.get("/")
# def root():
#     return {
#         "system": "Petroleum Engineering Backend",
#         "status": "Ready",
#         "day": 3
#     }

# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware  # <--- IMPORT PENTING!
# from api import pvt_gas

# app = FastAPI(title="Petroleum Engineering Software - Day 4")

# # --- PASANG SURAT IZIN (CORS) ---
# # Tanpa ini, browser akan memblokir frontend kamu
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],     # "*" artinya SEMUA BOLEH MASUK (Frontend manapun)
#     allow_credentials=True,
#     allow_methods=["*"],     # Boleh pakai metode apa aja (GET, POST, dll)
#     allow_headers=["*"],
# )
# # --------------------------------

# # Sambungkan Divisi Gas
# app.include_router(pvt_gas.router)

# @app.get("/health")
# def health():
#     return {"status": "ok", "server": "online"}

# @app.get("/")
# def root():
#     return {
#         "system": "Petroleum Engineering Backend",
#         "status": "Ready for Frontend",
#         "day": 4
#     }


# app/main.py

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

# --- 1. IMPORT ROUTER (DENGAN PENGECEKAN) ---
# Kita pakai try-except biar kalau file Week 1 hilang, Week 2 tetap jalan (dan sebaliknya)

# Import Week 2: Material Balance
try:
    from app.api import material_balance
    mbal_active = True
except ImportError as e:
    print(f"⚠️ Warning: Modul Material Balance tidak ditemukan/error. {e}")
    mbal_active = False

# Import Week 1: PVT Gas
# Cek apakah nama filenya 'pvt_gas.py' atau 'pvt.py' di folder app/api/
try:
    from app.api import pvt_gas as pvt_router  # Kita alias-kan jadi pvt_router
    pvt_active = True
except ImportError:
    try:
        from app.api import pvt as pvt_router # Coba nama file lama
        pvt_active = True
    except ImportError as e:
        print(f"⚠️ Warning: Modul PVT tidak ditemukan. {e}")
        pvt_active = False

# --- IMPORT ERROR HANDLING (Week 2 - Day 3) ---
try:
    from app.domain.mbal.exceptions import MbalDomainError, PhysicalConstraintError
    has_custom_errors = True
except ImportError:
    has_custom_errors = False


# --- SETUP APP ---
app = FastAPI(
    title="PetroHub API",
    description="Backend Engine for Material Balance & PVT",
    version="2.0.0"
)

# --- 2. SETTING CORS (Versi Paksa) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://petrohub-fe.vercel.app", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    allow_headers=["*"],
)


# --- 3. GLOBAL ERROR HANDLER ---
if has_custom_errors:
    @app.exception_handler(MbalDomainError)
    async def mbal_domain_exception_handler(request: Request, exc: MbalDomainError):
        # 422 untuk error Fisika, 400 untuk logic umum
        status_code = 422 if isinstance(exc, PhysicalConstraintError) else 400
        return JSONResponse(
            status_code=status_code,
            content={
                "status": "error",
                "error_type": exc.__class__.__name__,
                "message": str(exc),
                "path": request.url.path
            }
        )

# --- 4. SAMBUNGKAN ROUTER (KABEL) ---

# A. Pasang Kabel Week 2 (Material Balance)
# URL: http://localhost:8000/mbal/calculate
if mbal_active:
    app.include_router(material_balance.router, prefix="/mbal", tags=["Material Balance"])

# B. Pasang Kabel Week 1 (PVT Gas)
# PENTING: Perhatikan 'prefix'. 
# Jika Frontend memanggil '/pvt/gas/full', dan di file pvt_gas.py endpointnya '/full',
# maka prefix harus '/pvt/gas'.
if pvt_active:
    # Opsi 1: Prefix lengkap (Paling sering berhasil untuk struktur Week 1)
    app.include_router(pvt_router.router, prefix="/pvt/gas", tags=["PVT Gas"])
    
    # Opsi Cadangan (Uncomment jika Opsi 1 masih 404):
    # app.include_router(pvt_router.router, prefix="/pvt", tags=["PVT Gas Alternative"])

# --- 5. HEALTH CHECK ---
@app.get("/")
def read_root():
    return {
        "system": "PetroHub Engine",
        "status": "Running 🚀",
        "modules": {
            "material_balance": "Active" if mbal_active else "Inactive",
            "pvt_gas": "Active" if pvt_active else "Inactive"
        }
    }