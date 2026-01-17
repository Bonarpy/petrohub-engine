from app.services.pvt import gas_z_factor

z = gas_z_factor(
    pressure_psia=1,
    temperature_f=180,
    gas_gravity=0.7
)

print("Z-factor:", z)
