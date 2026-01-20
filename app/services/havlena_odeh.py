from app.models.havlena_odeh import (
    HavlenaOdehInput, 
    HavlenaOdehResponse, 
    RegressionResult
)
# Import transformation logic yang sudah kita buat sebelumnya
from app.domain.havlena_odeh.transformation import calculate_single_step

# Import regression logic yang dibuat pada day 2
from app.domain.havlena_odeh.regression import solve_havlena_odeh_regression

def process_havlena_odeh_data(data: HavlenaOdehInput) -> HavlenaOdehResponse:
    """
    [Service Day 1]
    Tugas: 
    1. Menerima input data produksi.
    2. Melakukan transformasi data menjadi variable MBE (F, Eo, Eg, Efw, We).
    3. Mengembalikan Response Struktur Lengkap (dengan placeholder untuk Regresi).
    """

    """
    [Service Day 2]
    Orkestrator Utama:
    1. Mengubah Data Raw -> Komponen MBE (F, Eo, dll).
    2. Mengirim Komponen MBE -> Engine Regresi (sesuai Skenario).
    3. Mengembalikan Hasil Analisis Lengkap.
    """
    
    # 1. Siapkan Wadah List (Container)
    F_list, Eo_list, Eg_list, Efw_list, We_list, P_list = [], [], [], [], [], []

    # Ambil konstanta reservoir sekali saja biar efisien
    props = data.properties
    assumptions = data.assumptions

    # 2. BATCH PROCESSING (Looping Data History)
    for point in data.history:
        
        # Panggil Domain Logic (Transformations)
        # Ini murni menghitung fisika per titik
        terms = calculate_single_step(
            p=point.pressure, 
            p_i=props.pi,
            np=point.np, 
            gp=point.gp, 
            wp=point.wp,
            bo=point.bo, 
            boi=props.boi,
            bg=point.bg, 
            bgi=props.bgi,
            rso=point.rso, 
            rsoi=props.rsoi,
            bw=point.bw,
            cw=props.cw, 
            cf=props.cf, 
            swc=props.swc,
            we=point.we,
            assumptions=assumptions
        )
        
        # Masukkan hasil perhitungan ke dalam list
        F_list.append(terms["F"])
        Eo_list.append(terms["Eo"])
        Eg_list.append(terms["Eg"])
        Efw_list.append(terms["Efw"])
        We_list.append(terms["We"])
        P_list.append(point.pressure)

    # 3. CONSTRUCT RESPONSE (Sesuai Model Terbaru)
    
    # NOTE DAY 1:
    # Karena Regresi Engine baru dibuat besok (Day 2), 
    # kita isi variable hasil regresi dengan nilai DEFAULT (0.0) 
    # agar Pydantic tidak error (Validation Error).
    
    # dummy_regression = RegressionResult(
    #     slope=0.0,
    #     intercept=0.0,
    #     r_squared=0.0,
    #     N=0.0,          # Belum dihitung
    #     m=None,         # Optional
    #     We=None         # Optional
    # )

    # Day 2 -> mesin regresi baru jalan
    regression_output = solve_havlena_odeh_regression(
        scenario=data.scenario,
        F=F_list,
        Eo=Eo_list,
        Eg=Eg_list,
        Efw=Efw_list,
        We=We_list,
        input_m=props.m  # Penting untuk Skenario 1, 2, 4
    )

    return HavlenaOdehResponse(
        # A. Data Visualisasi (Masih Kosong di Day 1)
        x_points=regression_output["x_points"],
        y_points=regression_output["y_points"],
        regression_line=regression_output["regression_line"],
        
        # B. Hasil Regresi (Placeholder)
        results=regression_output["result_object"],

        # C. Hasil Drive Index (Placeholder)
        drive_indices=None,
        
        # D. Data Audit (INI YANG SUDAH REAL HASIL PERHITUNGAN)
        F=F_list,
        Eo=Eo_list,
        Eg=Eg_list,
        Efw=Efw_list,
        We=We_list,
        pressure=P_list
    )