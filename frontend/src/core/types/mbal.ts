// src/core/types/mbal.ts

export interface ReservoirParams {
  pi: number;
  pb: number;   // Wajib ada (Bubble Point)
  boi: number;
  bgi: number;
  rsoi: number;
  m: number;
  cw: number;
  cf: number;
  swc: number;
}

export interface ProductionRow {
  pressure: number;
  np: number;
  wp: number;
  gp: number;
  bo: number;
  bg: number;
  rso: number;
  bw: number;
  we: number;   // Wajib ada (Water Influx)
}

// Tipe data untuk Hasil Return dari Backend
export interface CalculationResult {
  pressure: number;
  f_term: number;
  eo_term: number;
  eg_term: number;
  efw_term: number;
  we_term: number;
  x_axis: number;
  y_axis: number;
  calculated_n: number | null;
}