# app/domain/havlena_odeh/regression.py

import math
from typing import List, Tuple, Dict, Any
from app.models.havlena_odeh import HavlenaOdehScenario, RegressionResult

# =================================================================
# UTILITY: MATH HELPER (Saya sediakan biar Anda fokus ke Logic Fisika)
# =================================================================
def calculate_linear_regression(x: List[float], y: List[float]) -> Tuple[float, float, float]:
    """
    Menghitung Simple Linear Regression (Least Squares).
    Return: (slope, intercept, r_squared)
    """
    n = len(x)
    if n < 2: return 0.0, 0.0, 0.0

    sum_x = sum(x)
    sum_y = sum(y)
    sum_xy = sum(i*j for i, j in zip(x, y))
    sum_x2 = sum(i**2 for i in x)
    sum_y2 = sum(i**2 for i in y)

    denominator = (n * sum_x2 - sum_x**2)
    if denominator == 0: return 0.0, 0.0, 0.0

    slope = (n * sum_xy - sum_x * sum_y) / denominator
    intercept = (sum_y - slope * sum_x) / n

    numerator_r = (n * sum_xy - sum_x * sum_y)
    denominator_r = math.sqrt(denominator * (n * sum_y2 - sum_y**2))
    r_squared = 0.0 if denominator_r == 0 else (numerator_r / denominator_r)**2

    return slope, intercept, r_squared

# =================================================================
# MAIN LOGIC: HAVLENA ODEH SOLVER (AREA ANDA)
# =================================================================
def solve_havlena_odeh_regression(
    scenario: HavlenaOdehScenario,
    F: List[float],
    Eo: List[float],
    Eg: List[float],
    Efw: List[float],
    We: List[float],
    input_m: float
) -> RegressionResult:

    # List penampung X dan Y untuk regresi
    X_list = []
    Y_list = []
    skip_point = False

    # ---------------------------------------------------------
    # TAHAP 1: DATA PREPARATION (MAPPING X & Y)
    # ---------------------------------------------------------
    # Tugas Anda:
    # Loop data (zip F, Eo, Eg, Efw, We) dan tentukan rumus X & Y
    # sesuai Scenario yang dipilih.
    
    for f, eo, eg, efw, we in zip(F, Eo, Eg, Efw, We):
        
        # Hitung term Efw corrected dulu: efw * (1 + input_m)
        term_efw = efw * (1 + input_m)
        
        # --- LOGIC AREA: TENTUKAN X DAN Y ---
        if scenario == HavlenaOdehScenario.SCENARIO_1:
            # Rumus: F = N*Eo + We
            # TODO: Isi X dan Y di sini...
            X = eo
            Y = f 

        elif scenario == HavlenaOdehScenario.SCENARIO_2:
            # Rumus: F = N(Eo + mEg) + We
            # TODO: Isi X dan Y di sini...
            X = eo + (input_m * eg)
            Y = f

        elif scenario == HavlenaOdehScenario.SCENARIO_3:
            # Rumus: F/Eo = N + N*m(Eg/Eo)
            # TODO: Isi X dan Y di sini (Hati-hati Eo=0 division by zero)...
            if abs(eo) < 1e-9:
                skip_point = True
            else:
                X = eg / eo
                Y = f / eo

        elif scenario == HavlenaOdehScenario.SCENARIO_4:
            # Rumus: F = N * TotalExpansion + We
            # TODO: Isi X dan Y di sini...
            X=eo + input_m*eg + term_efw
            Y=f

            
        else:
            X, Y = 0.0, 0.0 # Default

        if not skip_point:
            X_list.append(X)
            Y_list.append(Y)

    # ---------------------------------------------------------
    # TAHAP 2: RUN REGRESSION
    # ---------------------------------------------------------
    slope, intercept, r2 = calculate_linear_regression(X_list, Y_list)

    # ---------------------------------------------------------
    # TAHAP 3: INTERPRETATION (MAPPING MATH -> PHYSICS)
    # ---------------------------------------------------------
    # Tugas Anda: Terjemahkan Slope/Intercept jadi N, m, We
    
    calc_N = 0.0
    calc_m = None
    calc_We = None

    # --- LOGIC AREA: MAPPING HASIL ---
    if scenario == HavlenaOdehScenario.SCENARIO_1:
        # TODO: Siapa N? Siapa We?
        calc_N = slope
        calc_We = intercept
        
    elif scenario == HavlenaOdehScenario.SCENARIO_2:
        # TODO: Siapa N? Siapa We?
        calc_N = slope
        calc_We = intercept

    elif scenario == HavlenaOdehScenario.SCENARIO_3:
        # TODO: Siapa N? Siapa m? (Ingat Slope = N*m)
        calc_N = intercept
        if abs(calc_N) > 1e-9:
            calc_m = slope / calc_N
        else:
            calc_m = 0.0 # Atau None, indikasi gagal

    elif scenario == HavlenaOdehScenario.SCENARIO_4:
        calc_N = slope
        calc_We = intercept
        pass

    # ---------------------------------------------------------
    # TAHAP 4: RETURN
    # ---------------------------------------------------------
    # Buat garis regresi untuk visualisasi
    regression_line = [(slope * x + intercept) for x in X_list]

    return RegressionResult(
        # Visual
        x_points=X_list,
        y_points=Y_list,
        regression_line=regression_line,
        # Statistik & Fisika
        slope=slope,
        intercept=intercept,
        r_squared=r2,
        N=calc_N,
        m=calc_m,
        We=calc_We
    )