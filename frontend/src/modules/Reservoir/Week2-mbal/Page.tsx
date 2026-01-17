import React, { useState } from 'react';
// Import Types & API Client (Pastikan path 3 level ke atas benar)
import { ReservoirParams, ProductionRow, CalculationResult } from '../../../core/types/mbal';
import apiClient from '../../../core/api/client';

export default function MaterialBalancePage() {
  
  // --- STATE DATA ---
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Assumptions
  const [assumptions, setAssumptions] = useState<string[]>([]);
  
  // Reservoir Props
  const [resParams, setResParams] = useState<ReservoirParams>({
    pi: 5000, pb: 3000, boi: 1.2, bgi: 0.001, rsoi: 500,
    m: 0, cw: 0, cf: 0, swc: 0
  });

  // History Table
  const [history, setHistory] = useState<ProductionRow[]>([
    { pressure: 4000, np: 20000, wp: 0, gp: 10000000, bo: 1.25, bg: 0.0015, rso: 500, bw: 1.0, we: 0 }
  ]);

  // --- 1. SMART INPUT HANDLER ---
  const handleSafeInput = (
    val: string, 
    currentValue: number, 
    setter: (val: number) => void
  ) => {
    // Cek kosong
    if (val.trim() === '') {
        alert("⚠️ Invalid Input: Field tidak boleh kosong! Nilai di-reset ke 0.");
        setter(0); 
        return;
    }
    // Parse Float (Hapus 0 di depan)
    const num = parseFloat(val);
    // Cek Validitas
    if (isNaN(num)) {
        alert("⚠️ Invalid Input: Harap masukkan angka yang valid.");
        setter(currentValue);
        return;
    }
    setter(num);
  };

  // --- LOGIC UI HANDLERS ---
  const handleCheck = (val: string) => {
    setAssumptions(prev => prev.includes(val) ? prev.filter(a => a !== val) : [...prev, val]);
  };

  const updateResParam = (key: keyof ReservoirParams, val: string) => {
    handleSafeInput(val, resParams[key], (newVal) => {
        setResParams({ ...resParams, [key]: newVal });
    });
  };

  const updateHistory = (idx: number, field: keyof ProductionRow, val: string) => {
    // @ts-ignore
    handleSafeInput(val, history[idx][field], (newVal) => {
        const newHist = [...history];
        // @ts-ignore
        newHist[idx][field] = newVal;
        setHistory(newHist);
    });
  };

  const addRow = () => {
    setHistory([...history, { pressure: 0, np: 0, wp: 0, gp: 0, bo: 0, bg: 0, rso: 0, bw: 1, we: 0 }]);
  };

  // --- LOGIC CALCULATE (VALIDATION GUARD + CRASH PROTECTION) ---
  const handleCalculate = async () => {
    setLoading(true);
    setErrorMsg('');
    setResult(null);

    try {
        // 1. CLONE DATA
        const payloadReservoir = { ...resParams };
        const payloadHistory = history.map(row => ({ ...row }));

        // =========================================================
        // 🛡️ VALIDATION GUARD (SATPAM LOGIKA)
        // =========================================================

        // RULE 1: Pb harus <= Pi (Global Rule)
        if (payloadReservoir.pb > payloadReservoir.pi) {
            alert(`⚠️ Physics Error: Tekanan Bubble Point (Pb = ${payloadReservoir.pb}) tidak boleh lebih besar dari Tekanan Awal (Pi = ${payloadReservoir.pi})!`);
            setLoading(false);
            return; // STOP PROSES
        }

        // RULE 2: Validasi Khusus Undersaturated
        if (assumptions.includes("undersaturated")) {
            for (let i = 0; i < payloadHistory.length; i++) {
                const P = payloadHistory[i].pressure;
                const Pb = payloadReservoir.pb;
                const Pi = payloadReservoir.pi;

                // Syarat: Pb <= P < Pi
                if (P < Pb) {
                    alert(`⚠️ Undersaturated Error (Row ${i+1}): Tekanan (${P}) sudah turun di bawah Bubble Point (${Pb}). Asumsi Undersaturated batal!`);
                    setLoading(false); return;
                }
                if (P >= Pi) {
                    // Note: Biasanya P=Pi di awal gpp, tapi user minta P < Pi secara ketat? 
                    // Saya buat P > Pi yang error, P = Pi warning/allow. 
                    // Sesuai request "P harus berada di tengah", berarti P tidak boleh lebih dari Pi.
                    if (P > Pi) {
                        alert(`⚠️ Data Error (Row ${i+1}): Tekanan saat ini (${P}) tidak boleh melebihi Tekanan Awal (${Pi}).`);
                        setLoading(false); return;
                    }
                }
            }
        }

        // =========================================================
        // 🔧 CRASH PROTECTION & SANITIZATION
        // =========================================================
        
        // A. Prevent Division by Zero
        if (payloadReservoir.boi <= 0) payloadReservoir.boi = 1.0; 
        if (payloadReservoir.pi <= 0) payloadReservoir.pi = 14.7; 

        payloadHistory.forEach(row => {
            if (row.bo <= 0) row.bo = 1.0;
            if (row.bw <= 0) row.bw = 1.0;
            if (row.bg <= 0) row.bg = 1.0; 
        });

        // B. Inject Dummy Data based on Assumptions
        if (assumptions.includes("undersaturated") || assumptions.includes("no_gas_cap")) {
            if (!payloadReservoir.bgi || payloadReservoir.bgi <= 0) payloadReservoir.bgi = 1.0;
            payloadHistory.forEach(row => {
                row.bg = 1.0;
            });
            
            if (assumptions.includes("no_gas_cap")) {
                payloadReservoir.m = 0;
            }
        }

        if (assumptions.includes("volumetric")) {
            payloadHistory.forEach(row => {
                row.we = 0;
            });
        }

        // 4. TEMBAK API BACKEND
        const response = await apiClient.post('/mbal/calculate', {
            reservoir: payloadReservoir,
            production_history: payloadHistory,
            assumptions: assumptions
        });

        // 5. TANGKAP HASIL
        if (response.data.results && response.data.results.length > 0) {
            setResult(response.data.results[0]);
            setTimeout(() => {
                document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }

    } catch (err: any) {
        console.error("Error Details:", err);
        setErrorMsg(err.response?.data?.detail || "Gagal menghubungi Backend. Pastikan Server Python nyala!");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="bg-light min-vh-100 font-sans">
      
      {/* --- 0. INTERNAL CSS --- */}
      <style>{`
        .card-header { font-weight: 600; letter-spacing: 0.5px; }
        .form-label { font-size: 0.85rem; font-weight: 500; color: #555; }
        .result-box { transition: all 0.3s; border-left: 4px solid transparent; }
        .result-box:hover { transform: translateY(-3px); border-left: 4px solid #0d6efd; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        .table-input { border: none; background: transparent; width: 100%; text-align: center; }
        .table-input:focus { outline: none; background: #e9ecef; border-radius: 4px; }
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>

      {/* --- 1. NAVBAR --- */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top mb-4 shadow-sm">
        <div className="container">
            <a className="navbar-brand fw-bold" href="../index.html">⛽ PetroHub</a>
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
                <ul className="navbar-nav ms-auto">
                    <li className="nav-item"><a className="nav-link" href="../index.html">Home</a></li>
                    <li className="nav-item dropdown">
                        <a className="nav-link dropdown-toggle active" href="#" role="button" data-bs-toggle="dropdown">
                            Reservoir
                        </a>
                        <ul className="dropdown-menu">
                            <li><a className="dropdown-item" href="pvt.html"><i className="bi bi-droplet-half me-2"></i> PVT Analysis</a></li>
                            <li><a className="dropdown-item active bg-primary text-white" href="material-balance.html"><i className="bi bi-lightning-charge me-2"></i> Material Balance (New)</a></li>
                            <li><hr className="dropdown-divider" /></li>
                            <li><a className="dropdown-item disabled" href="#">Decline Curve (Soon)</a></li>
                        </ul>
                    </li>
                </ul>
            </div>
        </div>
      </nav>

      <div className="container pb-5">
        
        {/* --- 2. HEADER --- */}
        <div className="row mb-4">
            <div className="col-12">
                <nav aria-label="breadcrumb">
                    <ol className="breadcrumb">
                        <li className="breadcrumb-item"><a href="../index.html" className="text-decoration-none">Home</a></li>
                        <li className="breadcrumb-item">Reservoir</li>
                        <li className="breadcrumb-item active" aria-current="page">Material Balance</li>
                    </ol>
                </nav>
                <h2 className="fw-bold text-dark"><i className="bi bi-lightning-charge-fill text-primary"></i> Material Balance Calculator</h2>
                <p className="text-muted">Estimation of Hydrocarbons in Place (IOIP) using Havlena-Odeh Method.</p>
            </div>
        </div>

        <div className="row g-4">
            
            {/* --- 3. INPUT PARAMETERS --- */}
            <div className="col-lg-4">
                
                {/* A. CARD ASUMSI */}
                <div className="card shadow-sm border-0 mb-4">
                    <div className="card-header bg-secondary text-white">
                        <i className="bi bi-gear-fill me-2"></i> 1. Model Assumptions
                    </div>
                    <div className="card-body">
                        <p className="small text-muted mb-2">Select active drive mechanisms:</p>
                        <div className="d-flex flex-column gap-2">
                            {['no_gas_cap', 'volumetric', 'no_compressibility', 'undersaturated'].map((opt) => (
                                <div className="form-check" key={opt}>
                                    <input 
                                        className="form-check-input" type="checkbox" id={opt}
                                        checked={assumptions.includes(opt)} onChange={() => handleCheck(opt)}
                                    />
                                    <label className="form-check-label text-capitalize small fw-bold" htmlFor={opt}>
                                        {opt.replace(/_/g, ' ')}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* B. CARD RESERVOIR PROPS */}
                <div className="card shadow-sm border-0">
                    <div className="card-header bg-primary text-white">
                        <i className="bi bi-sliders me-2"></i> 2. Reservoir Properties
                    </div>
                    <div className="card-body">
                        <h6 className="fw-bold text-primary mb-3 small text-uppercase">Initial Conditions</h6>
                        
                        <div className="row g-2 mb-2">
                            <div className="col-6">
                                <label className="form-label">Pi (psia)</label>
                                <input type="number" className="form-control form-control-sm" value={resParams.pi} onChange={(e) => updateResParam('pi', e.target.value)} />
                            </div>
                            <div className="col-6">
                                <label className="form-label">Pb (psia)</label>
                                <input type="number" className="form-control form-control-sm" value={resParams.pb} onChange={(e) => updateResParam('pb', e.target.value)} />
                            </div>
                        </div>

                        <div className="row g-2 mb-2">
                             <div className="col-4">
                                <label className="form-label">Boi (rb/stb)</label>
                                <input type="number" className="form-control form-control-sm" value={resParams.boi} onChange={(e) => updateResParam('boi', e.target.value)} />
                            </div>
                            <div className="col-4">
                                <label className="form-label">Bgi (rb/scf)</label>
                                <input 
                                    type="number" className="form-control form-control-sm" value={resParams.bgi} 
                                    disabled={assumptions.includes('undersaturated') || assumptions.includes('no_gas_cap')}
                                    onChange={(e) => updateResParam('bgi', e.target.value)} 
                                />
                            </div>
                            <div className="col-4">
                                <label className="form-label">Rsoi (scf/stb)</label>
                                <input type="number" className="form-control form-control-sm" value={resParams.rsoi} onChange={(e) => updateResParam('rsoi', e.target.value)} />
                            </div>
                        </div>

                        <hr className="my-3"/>
                        <h6 className="fw-bold text-secondary mb-3 small text-uppercase">Rock & Cap Props</h6>
                        
                        <div className="mb-2">
                            <label className="form-label">Gas Cap Ratio (m)</label>
                            <input type="number" className="form-control form-control-sm" value={resParams.m} 
                                   disabled={assumptions.includes('no_gas_cap')}
                                   onChange={(e) => updateResParam('m', e.target.value)} />
                        </div>

                        <div className="row g-2">
                             <div className="col-4">
                                <label className="form-label">Cw (psi⁻¹)</label>
                                <input type="number" className="form-control form-control-sm" value={resParams.cw} disabled={assumptions.includes('no_compressibility')} onChange={(e) => updateResParam('cw', e.target.value)} />
                            </div>
                            <div className="col-4">
                                <label className="form-label">Cf (psi⁻¹)</label>
                                <input type="number" className="form-control form-control-sm" value={resParams.cf} disabled={assumptions.includes('no_compressibility')} onChange={(e) => updateResParam('cf', e.target.value)} />
                            </div>
                            <div className="col-4">
                                <label className="form-label">Swc (frac)</label>
                                <input type="number" className="form-control form-control-sm" value={resParams.swc} disabled={assumptions.includes('no_compressibility')} onChange={(e) => updateResParam('swc', e.target.value)} />
                            </div>
                        </div>

                    </div>
                </div>

            </div>

            {/* --- 4. PRODUCTION HISTORY TABLE --- */}
            <div className="col-lg-8">
                <div className="card shadow-sm border-0 mb-4 h-100">
                    <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
                        <span><i className="bi bi-table me-2"></i> 3. Production History</span>
                        <button onClick={addRow} className="btn btn-sm btn-light text-success fw-bold border-0 shadow-sm">
                            <i className="bi bi-plus-lg"></i> Row
                        </button>
                    </div>
                    <div className="card-body p-0">
                        <div className="table-responsive" style={{maxHeight: '450px'}}>
                            <table className="table table-hover table-bordered m-0 align-middle text-center small">
                                <thead className="table-light sticky-top">
                                    <tr>
                                        <th style={{width: '10%'}}>P</th>
                                        <th style={{width: '12%'}}>Np</th>
                                        <th style={{width: '12%'}}>Gp</th>
                                        <th style={{width: '10%'}}>Wp</th>
                                        <th style={{width: '10%'}}>We</th>
                                        <th>Bo</th>
                                        <th>Bg</th>
                                        <th>Bw</th>
                                        <th>Rso</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map((row, idx) => (
                                        <tr key={idx}>
                                            <td className="p-0"><input type="number" className="table-input py-2" value={row.pressure} onChange={(e) => updateHistory(idx, 'pressure', e.target.value)} /></td>
                                            <td className="p-0"><input type="number" className="table-input py-2" value={row.np} onChange={(e) => updateHistory(idx, 'np', e.target.value)} /></td>
                                            <td className="p-0"><input type="number" className="table-input py-2" value={row.gp} onChange={(e) => updateHistory(idx, 'gp', e.target.value)} /></td>
                                            <td className="p-0"><input type="number" className="table-input py-2" value={row.wp} onChange={(e) => updateHistory(idx, 'wp', e.target.value)} /></td>
                                            <td className="p-0"><input type="number" className="table-input py-2" value={row.we} disabled={assumptions.includes('volumetric')} onChange={(e) => updateHistory(idx, 'we', e.target.value)} /></td>
                                            <td className="p-0"><input type="number" className="table-input py-2" value={row.bo} onChange={(e) => updateHistory(idx, 'bo', e.target.value)} /></td>
                                            <td className="p-0"><input type="number" className="table-input py-2" value={row.bg} disabled={assumptions.includes('undersaturated') || assumptions.includes('no_gas_cap')} onChange={(e) => updateHistory(idx, 'bg', e.target.value)} /></td>
                                            <td className="p-0"><input type="number" className="table-input py-2" value={row.bw} onChange={(e) => updateHistory(idx, 'bw', e.target.value)} /></td>
                                            <td className="p-0"><input type="number" className="table-input py-2" value={row.rso} onChange={(e) => updateHistory(idx, 'rso', e.target.value)} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="card-footer bg-white p-3">
                         <button 
                            className="btn btn-success w-100 fw-bold py-2 shadow-sm" 
                            onClick={handleCalculate}
                            disabled={loading}
                        >
                            {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-calculator me-2"></i>}
                            CALCULATE IOIP
                        </button>
                    </div>
                </div>
            </div>

        </div>

        {/* --- 5. RESULT SECTION --- */}
        <div id="result-section" className="mt-5">
            {errorMsg && (
                <div className="alert alert-danger shadow-sm text-center mb-4">
                    <strong>Error:</strong> {errorMsg}
                </div>
            )}

            {!result && !errorMsg && (
                <div className="text-center py-5 bg-white rounded shadow-sm border border-dashed">
                     <img src="https://cdn-icons-png.flaticon.com/512/2920/2920349.png" alt="Data" width="80" style={{opacity: 0.3}} />
                     <h5 className="mt-3 text-muted">Ready to Calculate</h5>
                     <p className="text-secondary small">Input reservoir data & production history above to see results.</p>
                </div>
            )}

            {result && (
                <div className="animate__animated animate__fadeInUp">
                    <div className="alert alert-success d-flex align-items-center mb-4 shadow-sm" role="alert">
                         <i className="bi bi-check-circle-fill me-2 fs-4"></i>
                         <div>Calculation completed successfully using <strong>Havlena-Odeh</strong> method.</div>
                    </div>

                    <div className="card bg-primary text-white mb-4 shadow text-center position-relative overflow-hidden">
                        <div className="card-body py-5">
                            <h6 className="text-uppercase opacity-75 letter-spacing-2">Initial Oil In Place (N)</h6>
                            <h1 className="display-2 fw-bold mb-0">
                                {result.calculated_n ? result.calculated_n.toLocaleString(undefined, {maximumFractionDigits: 0}) : "Error"}
                            </h1>
                            <span className="badge bg-white text-primary mt-2 px-3 py-2 rounded-pill fs-6">STB (Stock Tank Barrels)</span>
                        </div>
                    </div>

                    {/* GRID RESULT (3 Col x 2 Row) */}
                    <div className="row g-3">
                        <div className="col-md-4">
                             <div className="card result-box h-100 shadow-sm border-0">
                                <div className="card-body text-center">
                                    <h6 className="text-muted text-uppercase small">Total Withdrawal (F)</h6>
                                    <h4 className="fw-bold text-dark">{result.f_term.toLocaleString()}</h4>
                                    <small className="text-secondary">Res Bbl</small>
                                </div>
                             </div>
                        </div>

                        <div className="col-md-4">
                             <div className="card result-box h-100 shadow-sm border-0">
                                <div className="card-body text-center">
                                    <h6 className="text-muted text-uppercase small">Total Expansion (Et)</h6>
                                    <h4 className="fw-bold text-dark">{result.x_axis.toFixed(6)}</h4>
                                    <small className="text-secondary">rb/stb</small>
                                </div>
                             </div>
                        </div>

                        <div className="col-md-4">
                             <div className="card result-box h-100 shadow-sm border-0">
                                <div className="card-body text-center">
                                    <h6 className="text-muted text-uppercase small">Water Influx (We)</h6>
                                    <h4 className="fw-bold text-dark text-primary">{result.we_term.toLocaleString()}</h4>
                                    <small className="text-secondary">bbl</small>
                                </div>
                             </div>
                        </div>

                         <div className="col-md-4">
                             <div className="card result-box h-100 shadow-sm border-0">
                                <div className="card-body text-center">
                                    <h6 className="text-muted text-uppercase small">Oil Expansion (Eo)</h6>
                                    <h4 className="fw-bold text-dark">{result.eo_term.toFixed(5)}</h4>
                                    <small className="text-secondary">rb/stb</small>
                                </div>
                             </div>
                        </div>

                        <div className="col-md-4">
                             <div className="card result-box h-100 shadow-sm border-0">
                                <div className="card-body text-center">
                                    <h6 className="text-muted text-uppercase small">Gas Expansion (Eg)</h6>
                                    <h4 className="fw-bold text-dark">{result.eg_term.toFixed(5)}</h4>
                                    <small className="text-secondary">rb/scf</small>
                                </div>
                             </div>
                        </div>

                        <div className="col-md-4">
                             <div className="card result-box h-100 shadow-sm border-0">
                                <div className="card-body text-center">
                                    <h6 className="text-muted text-uppercase small">Fm. & Water Exp. (Efw)</h6>
                                    <h4 className="fw-bold text-dark">{result.efw_term.toFixed(5)}</h4>
                                    <small className="text-secondary">rb/stb</small>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            )}
        </div>

      </div>
    </div>
  );
}