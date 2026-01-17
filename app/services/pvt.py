def gas_z_factor(pressure_psia: float, temperature_f: float, gas_gravity: float) -> float:
    """
    Menghitung Z-Factor Gas (Simplified Correlation).
    
    Parameters:
    - pressure_psia (float): Tekanan dalam psi absolute
    - temperature_f (float): Temperatur dalam Fahrenheit
    - gas_gravity (float): Specific gravity gas (Air = 1.0)
    
    Returns:
    - float: Nilai Z-factor (dimensionless)
    """
    
    # 1. Engineering Sanity Check (Validasi Input)
    # Engineer yang baik menolak angka minus untuk tekanan
    if pressure_psia < 0:
        raise ValueError("Pressure tidak boleh negatif")
    
    # 2. Konversi Unit (Fahrenheit -> Rankine)
    temperature_r = temperature_f + 459.67

    # 3. Hitung Pseudocritical Properties (Rumus Standing)
    t_pc = 168 + 325 * gas_gravity - 12.5 * (gas_gravity ** 2)
    p_pc = 677 + 15 * gas_gravity - 37.5 * (gas_gravity ** 2)

    # 4. Hitung Reduced Properties (P_pr dan T_pr)
    # Hati-hati pembagian dengan nol (walau t_pc jarang nol)
    p_pr = pressure_psia / p_pc
    t_pr = temperature_r / t_pc

    # 5. Rumus Z-Factor (Versi Sederhana untuk Day 2)
    # Nanti di level lanjut kita ganti pakai Hall-Yarborough atau Dranchuk-Abou Kassem
    z = 1 / (1 + (0.1 * p_pr))

    return z