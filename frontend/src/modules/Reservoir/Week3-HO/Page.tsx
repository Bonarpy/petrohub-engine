// import React, { useState } from 'react';
// import { 
//   ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Scatter, Label 
// } from 'recharts';
// import apiClient from '../../../core/api/client';

// // --- TYPES (Define directly here or import from types file) ---
// interface ReservoirProps {
//   pi: number; pb: number; boi: number; bgi: number; rsoi: number;
//   m: number; cw: number; cf: number; swc: number;
// }

// interface ProductionRow {
//   pressure: number; np: number; gp: number; wp: number; we: number;
//   bo: number; bg: number; bw: number; rso: number;
// }

// interface RegressionResult {
//   x_points: number[];
//   y_points: number[];
//   regression_line: number[];
//   slope: number; intercept: number; r_squared: number;
//   N: number; m: number | null; We: number | null;
// }

// interface DriveIndices {
//   dominant_mechanism: string;
//   DDI: number; SDI: number; WDI: number;
// }

// interface HavlenaResponse {
//   results: RegressionResult;
//   drive_indices: DriveIndices | null;
// }

// // --- SUB-COMPONENT: CHART ---
// const HavlenaOdehChart: React.FC<{ data: RegressionResult; scenario: string }> = ({ data, scenario }) => {
//   // Zip data for Recharts
//   const chartData = data.x_points.map((x, i) => ({
//     x_val: x,
//     y_actual: data.y_points[i],
//     y_reg: data.regression_line[i]
//   }));

//   // Dynamic Axis Labels
//   const getLabels = (scen: string) => {
//     switch (scen) {
//       case "F vs Eo": return { x: "Eo (Expansion)", y: "F (Withdrawal)" };
//       case "F vs (Eo + mEg)": return { x: "Eo + mEg", y: "F" };
//       case "F/Eo vs Eg/Eo": return { x: "Eg / Eo", y: "F / Eo" };
//       case "F vs Total Expansion": return { x: "Total Expansion (Et)", y: "F" };
//       default: return { x: "X", y: "Y" };
//     }
//   };
//   const labels = getLabels(scenario);

//   return (
//     <ResponsiveContainer width="100%" height={350}>
//       <ComposedChart data={chartData} margin={{ top: 20, right: 30, bottom: 40, left: 40 }}>
//         <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
//         <XAxis type="number" dataKey="x_val" domain={['auto', 'auto']}>
//            <Label value={labels.x} offset={0} position="bottom" />
//         </XAxis>
//         <YAxis type="number" domain={['auto', 'auto']}>
//            <Label value={labels.y} angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
//         </YAxis>
//         <Tooltip cursor={{ strokeDasharray: '3 3' }} />
//         <Legend verticalAlign="top" height={36}/>
//         <Scatter name="Production Data" dataKey="y_actual" fill="#0d6efd" shape="circle" />
//         <Line type="monotone" dataKey="y_reg" stroke="#dc3545" dot={false} strokeWidth={2} name="Regression Line" />
//       </ComposedChart>
//     </ResponsiveContainer>
//   );
// };

// // --- MAIN PAGE COMPONENT ---
// export default function MaterialBalancePage() {
  
//   // STATE
//   const [loading, setLoading] = useState(false);
//   const [result, setResult] = useState<HavlenaResponse | null>(null);
//   const [scenario, setScenario] = useState("F vs Eo");
//   const [assumptions, setAssumptions] = useState<string[]>(["no_gas_cap"]); // Default assumption

//   const [props, setProps] = useState<ReservoirProps>({
//     pi: 4000, pb: 4000, boi: 1.25, bgi: 0.00087, rsoi: 750,
//     m: 0, cw: 0.000003, cf: 0.000004, swc: 0.25
//   });

//   const [history, setHistory] = useState<ProductionRow[]>([
//     { pressure: 4000, np: 0, gp: 0, wp: 0, we: 0, bo: 1.25, bg: 0.00087, bw: 1.02, rso: 750 },
//     { pressure: 3800, np: 50000, gp: 40000000, wp: 200, we: 0, bo: 1.265, bg: 0.00092, bw: 1.02, rso: 700 },
//     { pressure: 3600, np: 120000, gp: 100000000, wp: 1500, we: 0, bo: 1.280, bg: 0.00098, bw: 1.02, rso: 650 },
//     { pressure: 3400, np: 250000, gp: 220000000, wp: 5000, we: 0, bo: 1.300, bg: 0.00105, bw: 1.02, rso: 600 }
//   ]);

//   // HANDLERS
//   const updateProp = (key: keyof ReservoirProps, val: string) => {
//     setProps({ ...props, [key]: parseFloat(val) || 0 });
//   };

//   const updateHistory = (idx: number, key: keyof ProductionRow, val: string) => {
//     const newHist = [...history];
//     newHist[idx] = { ...newHist[idx], [key]: parseFloat(val) || 0 };
//     setHistory(newHist);
//   };

//   const addRow = () => {
//     setHistory([...history, { 
//       pressure: 0, np: 0, gp: 0, wp: 0, we: 0, bo: 1, bg: 0.001, bw: 1, rso: 0 
//     }]);
//   };

//   const handleCalculate = async () => {
//     setLoading(true);
//     try {
//       // Panggil API Backend (Sesuaikan URL dengan app/main.py)
//       const payload = {
//         scenario: scenario,
//         assumptions: assumptions,
//         properties: props,
//         history: history
//       };
      
//       const response = await apiClient.post('/havlena-odeh/calculate', payload);
//       setResult(response.data);
//     } catch (err: any) {
//       alert("Error: " + (err.response?.data?.detail || err.message));
//     } finally {
//       setLoading(false);
//     }
//   };

//   // HELPER FOR DRIVE INDEX BAR
//   const renderProgressBar = (label: string, value: number, color: string) => (
//     <div className="mb-2">
//       <div className="d-flex justify-content-between small">
//         <span>{label}</span>
//         <span>{(value * 100).toFixed(1)}%</span>
//       </div>
//       <div className="progress" style={{ height: '6px' }}>
//         <div className={`progress-bar bg-${color}`} style={{ width: `${value * 100}%` }}></div>
//       </div>
//     </div>
//   );

//   return (
//     <div className="bg-light min-vh-100 font-sans pb-5">
      
//       {/* --- NAVBAR --- */}
//       <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top mb-4 shadow-sm">
//         <div className="container">
//           <a className="navbar-brand fw-bold" href="/">⛽ PetroHub</a>
//           <div className="collapse navbar-collapse">
//             <ul className="navbar-nav ms-auto">
//               <li className="nav-item"><a className="nav-link active" href="#">Reservoir / Material Balance</a></li>
//             </ul>
//           </div>
//         </div>
//       </nav>

//       <div className="container-fluid px-4">
        
//         {/* --- HEADER --- */}
//         <div className="row mb-4">
//           <div className="col-12">
//             <h2 className="fw-bold text-dark"><i className="bi bi-graph-up"></i> Material Balance Analysis</h2>
//             <p className="text-muted">Havlena-Odeh Method: Determine OOIP (N), Gas Cap (m), and Drive Mechanism.</p>
//           </div>
//         </div>

//         <div className="row g-3">
          
//           {/* --- LEFT COL: INPUTS --- */}
//           <div className="col-lg-4">
//             <div className="card shadow-sm border-0 h-100">
//               <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
//                 <span><i className="bi bi-sliders"></i> Reservoir Data</span>
//               </div>
//               <div className="card-body">
                
//                 {/* 1. SCENARIO */}
//                 <h6 className="fw-bold text-success mb-2">1. Analysis Strategy</h6>
//                 <select className="form-select form-select-sm mb-3" value={scenario} onChange={e => setScenario(e.target.value)}>
//                   <option value="F vs Eo">Scenario 1: F vs Eo (Water Drive / Volumetric)</option>
//                   <option value="F vs (Eo + mEg)">Scenario 2: F vs (Eo + mEg) (Known m)</option>
//                   <option value="F/Eo vs Eg/Eo">Scenario 3: F/Eo vs Eg/Eo (Find m)</option>
//                   <option value="F vs Total Expansion">Scenario 4: General Check</option>
//                 </select>

//                 {/* 2. PROPERTIES (Simplified Grid) */}
//                 <h6 className="fw-bold text-primary mb-2">2. Reservoir Properties</h6>
//                 <div className="row g-2 mb-3">
//                   <div className="col-4">
//                     <label className="small text-muted">Pi (psia)</label>
//                     <input type="number" className="form-control form-control-sm" value={props.pi} onChange={e => updateProp('pi', e.target.value)} />
//                   </div>
//                   <div className="col-4">
//                     <label className="small text-muted">Boi (rb/stb)</label>
//                     <input type="number" className="form-control form-control-sm" value={props.boi} onChange={e => updateProp('boi', e.target.value)} />
//                   </div>
//                    <div className="col-4">
//                     <label className="small text-muted">Rsoi</label>
//                     <input type="number" className="form-control form-control-sm" value={props.rsoi} onChange={e => updateProp('rsoi', e.target.value)} />
//                   </div>
//                    <div className="col-4">
//                     <label className="small text-muted">m (GasCap)</label>
//                     <input type="number" className="form-control form-control-sm" value={props.m} onChange={e => updateProp('m', e.target.value)} />
//                   </div>
//                   <div className="col-4">
//                     <label className="small text-muted">Bgi (rb/scf)</label>
//                     <input type="number" className="form-control form-control-sm" value={props.bgi} onChange={e => updateProp('bgi', e.target.value)} />
//                   </div>
//                   <div className="col-4">
//                     <label className="small text-muted">Swc</label>
//                     <input type="number" className="form-control form-control-sm" value={props.swc} onChange={e => updateProp('swc', e.target.value)} />
//                   </div>
//                 </div>

//                 {/* 3. HISTORY TABLE */}
//                 <div className="d-flex justify-content-between align-items-center mb-2">
//                    <h6 className="fw-bold text-dark mb-0">3. Production History</h6>
//                    <button onClick={addRow} className="btn btn-xs btn-outline-secondary py-0">+ Row</button>
//                 </div>
                
//                 <div className="table-responsive border rounded mb-3" style={{ maxHeight: '300px' }}>
//                   <table className="table table-sm table-striped table-hover mb-0" style={{ fontSize: '0.8rem' }}>
//                     <thead className="table-light sticky-top">
//                       <tr>
//                         <th>Pres</th><th>Np</th><th>Gp</th><th>Wp</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {history.map((row, i) => (
//                         <tr key={i}>
//                           <td className="p-0"><input type="number" className="form-control form-control-sm border-0 rounded-0" value={row.pressure} onChange={e => updateHistory(i, 'pressure', e.target.value)} /></td>
//                           <td className="p-0"><input type="number" className="form-control form-control-sm border-0 rounded-0" value={row.np} onChange={e => updateHistory(i, 'np', e.target.value)} /></td>
//                           <td className="p-0"><input type="number" className="form-control form-control-sm border-0 rounded-0" value={row.gp} onChange={e => updateHistory(i, 'gp', e.target.value)} /></td>
//                           <td className="p-0"><input type="number" className="form-control form-control-sm border-0 rounded-0" value={row.wp} onChange={e => updateHistory(i, 'wp', e.target.value)} /></td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>

//                 <button 
//                   className="btn btn-success w-100 fw-bold py-2 shadow-sm"
//                   onClick={handleCalculate}
//                   disabled={loading}
//                 >
//                   {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-cpu me-2"></i>}
//                   RUN ANALYSIS
//                 </button>
//               </div>
//             </div>
//           </div>

//           {/* --- MIDDLE COL: CHART --- */}
//           <div className="col-lg-5">
//             <div className="card shadow-sm border-0 h-100">
//               <div className="card-header bg-dark text-white">
//                 <i className="bi bi-display"></i> Havlena-Odeh Plot
//               </div>
//               <div className="card-body d-flex flex-column justify-content-center align-items-center bg-white">
                
//                 {result ? (
//                   <HavlenaOdehChart data={result.results} scenario={scenario} />
//                 ) : (
//                   <div className="text-center text-muted">
//                     <i className="bi bi-bar-chart-line fs-1"></i>
//                     <p className="mt-2">Chart will appear here after calculation</p>
//                   </div>
//                 )}

//               </div>
//             </div>
//           </div>

//           {/* --- RIGHT COL: RESULTS --- */}
//           <div className="col-lg-3">
            
//             {/* A. SCALAR RESULTS */}
//             <div className="card shadow-sm border-0 mb-3" style={{ borderLeft: '5px solid #0d6efd' }}>
//               <div className="card-body">
//                 <h6 className="text-muted text-uppercase small mb-1">Original Oil In Place (N)</h6>
//                 <h2 className="fw-bold text-primary mb-0">
//                   {result ? (result.results.N / 1000000).toFixed(2) : "0.00"}
//                 </h2>
//                 <small className="text-secondary">MMSTB</small>
                
//                 <hr className="my-2" />
                
//                 <div className="d-flex justify-content-between mb-1">
//                   <span className="text-muted small">Gas Cap (m)</span>
//                   <strong className="text-dark">
//                     {result?.results.m !== null ? result?.results.m?.toFixed(3) : "-"}
//                   </strong>
//                 </div>
//                 <div className="d-flex justify-content-between">
//                   <span className="text-muted small">R-Squared</span>
//                   <strong className="text-success">
//                     {result ? result.results.r_squared.toFixed(4) : "0.0000"}
//                   </strong>
//                 </div>
//               </div>
//             </div>

//             {/* B. DRIVE MECHANISM */}
//             <div className="card shadow-sm border-0">
//               <div className="card-header bg-warning text-dark border-0">
//                 <i className="bi bi-speedometer2"></i> Drive Mechanism
//               </div>
//               <div className="card-body">
//                 <div className="text-center mb-3">
//                   <span className="badge bg-dark text-white w-100 py-2" style={{ fontSize: '0.9rem' }}>
//                     {result?.drive_indices ? result.drive_indices.dominant_mechanism : "UNKNOWN"}
//                   </span>
//                 </div>

//                 {result?.drive_indices ? (
//                   <>
//                     {renderProgressBar("Depletion (DDI)", result.drive_indices.DDI, "primary")}
//                     {renderProgressBar("Gas Cap (SDI)", result.drive_indices.SDI, "danger")}
//                     {renderProgressBar("Water Drive (WDI)", result.drive_indices.WDI, "info")}
//                   </>
//                 ) : (
//                   <p className="text-center text-muted small">Run analysis to see drive indices</p>
//                 )}
//               </div>
//             </div>

//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

import React, { useState, useEffect } from 'react';
import  {HavlenaChart}  from './HavlenaChart';
import apiClient from '../../../core/api/client';

// ==========================================
// 1. TYPE DEFINITIONS (MATCHING PYTHON MODEL)
// ==========================================

// Input Interfaces
interface ReservoirProperties {
  pi: number; pb: number; boi: number; bgi: number; rsoi: number;
  m: number; cw: number; cf: number; swc: number;
}

interface ProductionRow {
  pressure: number; np: number; gp: number; wp: number; we: number;
  bo: number; bg: number; bw: number; rso: number;
}

// Output Interfaces (Sesuai HavlenaOdehResponse di Python)
interface RegressionResult {
  x_points: number[];
  y_points: number[];
  regression_line: number[];
  slope: number;
  intercept: number;
  r_squared: number;
  N: number;          // Original Oil In Place
  m: number | null;   // Optional/Nullable
  We: number | null;  // Optional/Nullable
}

interface DriveIndices {
  dominant_mechanism: string; // Enum converted to string by Pydantic
  DDI: number;
  SDI: number;
  WDI: number;
}

interface BackendResponse {
  results: RegressionResult;
  drive_indices: DriveIndices | null; // Bisa null jika regresi gagal/belum valid
  
  // Data Audit (Raw Terms)
  F: number[];
  Eo: number[];
  Eg: number[];
  Efw: number[];
  We: number[];
  pressure: number[];
}

export default function HavlenaOdehPage() {
  
  // ==========================================
  // 2. STATE MANAGEMENT
  // ==========================================
  
  const [loading, setLoading] = useState(false);
  
  // State Skenario (Value harus SAMA PERSIS dengan Enum Python)
  const [scenario, setScenario] = useState("F vs Eo"); 
  
  // State Asumsi (Otomatis berubah via useEffect)
  const [assumptions, setAssumptions] = useState<string[]>(["no_gas_cap"]);
  
  const [result, setResult] = useState<BackendResponse | null>(null);
  
  // Reservoir Properties
  const [props, setProps] = useState<ReservoirProperties>({
    pi: 4000, pb:3000, boi: 1.25, bgi: 0.00087, rsoi: 750,
    m: 0, cw: 0.000003, cf: 0.000004, swc: 0.25
  });

  // Production History
  const [history, setHistory] = useState<ProductionRow[]>([
    { pressure: 4000, np: 0, gp: 0, wp: 0, we: 0, bo: 1.25, bg: 0.00087, bw: 1.02, rso: 750 },
    { pressure: 3800, np: 50000, gp: 40000000, wp: 200, we: 0, bo: 1.265, bg: 0.00092, bw: 1.02, rso: 700 },
    { pressure: 3600, np: 120000, gp: 100000000, wp: 1500, we: 0, bo: 1.280, bg: 0.00098, bw: 1.02, rso: 650 },
  ]);

  // ==========================================
  // 3. EFFECT: AUTO-ADJUST ASSUMPTIONS
  // ==========================================
  // Logic ini memastikan input fisika konsisten dengan Skenario yang dipilih
  
  useEffect(() => {
    console.log(`🔄 Scenario changed to: ${scenario}`);

    switch (scenario) {
      case "F vs Eo":
        // SCENARIO 1: Mencari N, Asumsi Water Drive/Volumetric.
        // Syarat mutlak: TIDAK ADA GAS CAP.
        setAssumptions(["no_gas_cap","no_compressibility"]);
        setProps(prev => ({ ...prev, m: 0, cw: 0, cf: 0, swc: 0 })); // Reset m visual ke 0
        break;

      case "F vs (Eo + mEg)":
        // SCENARIO 2: Mencari N dan We, dengan m diketahui.
        // Asumsi: Gas Cap ADA (m > 0) atau user input manual.
        setAssumptions(["no_compressibility"]); // Hapus flag 'no_gas_cap'
        setProps(prev => ({ ...prev, cw: 0, cf: 0, swc: 0 })); // Biarkan m sesuai input user
        break;

      case "F/Eo vs Eg/Eo":
        // SCENARIO 3: Mencari N dan m.
        // Ini khusus untuk mencari ukuran Gas Cap.
        setAssumptions(["no_compressibility","volumetric"]); 
        setProps(prev => ({...prev, m:0,cw: 0, cf: 0, swc:0}))
        setHistory(prev => prev.map(row => ({...row, we:0}))); // Set We=0 di history
        break;

      case "F vs Total Expansion":
        // SCENARIO 4: General Check.
        // Biasanya dipakai setelah m dan N ketemu untuk validasi.
        setAssumptions([]);
        setProps(props);
        setHistory(history); // Set We=0 di history
        break;
        
      default:
        setAssumptions([]);
    }
  }, [scenario]);


  // ==========================================
  // 4. HANDLERS
  // ==========================================
  
  const updateProp = (key: keyof ReservoirProperties, val: string) => {
    setProps({ ...props, [key]: parseFloat(val) || 0 });
  };

  const updateHistory = (idx: number, key: keyof ProductionRow, val: string) => {
    const newHist = [...history];
    // @ts-ignore
    newHist[idx][key] = parseFloat(val) || 0;
    setHistory(newHist);
  };

  const addRow = () => {
    setHistory([...history, { 
      pressure: 0, np: 0, gp: 0, wp: 0, we: 0, bo: 1, bg: 0.001, bw: 1, rso: 0 
    }]);
  };

  const removeRow = () => {
    if (history.length > 1) setHistory(history.slice(0, -1));
  };

  const handleCalculate = async () => {
    setLoading(true);
    try {
      // Payload sesuai HavlenaOdehInput di Python
      const payload = {
        scenario: scenario,
        assumptions: assumptions,
        properties: props,
        history: history
      };
      
      const response = await apiClient.post<BackendResponse>('/havlena-odeh/calculate', payload);
      console.log("Result:", response.data);
      setResult(response.data);

    } catch (err: any) {
      console.error("Full Error Details:", err);
      
      let msg = "Terjadi kesalahan yang tidak diketahui.";
      
      // Cek apakah ini Error Validasi dari Pydantic (422)
      if (err.response?.data?.detail) {
          const detail = err.response.data.detail;
          
          if (Array.isArray(detail)) {
              // Loop semua error (biasanya Pydantic kasih list error)
              const errorList = detail.map((e: any) => 
                  `❌ Field: ${e.loc.join('.')} -> ${e.msg}`
              ).join('\n');
              msg = `Validasi Gagal:\n${errorList}`;
          } else {
              msg = detail;
          }
      } else if (err.message) {
          msg = err.message;
      }
      
      alert(msg);
      
    } finally {
      setLoading(false);
    }
  };

  // Helper UI
  const renderProgressBar = (label: string, value: number, color: string) => (
    <div className="mb-2 small">
      <div className="d-flex justify-content-between">
        <span>{label}</span>
        <span>{(value * 100).toFixed(1)}%</span>
      </div>
      <div className="progress" style={{ height: '6px' }}>
        <div className={`progress-bar bg-${color}`} style={{ width: `${value * 100}%` }}></div>
      </div>
    </div>
  );

  return (
    <div className="bg-light min-vh-100 font-sans pb-5">
      
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top mb-4">
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
                            <li>
                                <a className="dropdown-item active" href="pvt.html">
                                    <i className="bi bi-droplet-half"></i> PVT Analysis
                                </a>
                            </li>

                            <li>
                                <a className="dropdown-item" href="material-balance.html">
                                    <i className="bi bi-lightning-charge"></i> Material Balance (Two Point)
                                </a>
                            </li>

                            <li>
                                <a className='dropdown-item' href="havlena-odeh.html">
                                    <i className="bi bi-gear-fill"></i> Material Balance (Havlena-Odeh)
                                </a>
                            </li>

                            <li><hr className="dropdown-divider"></hr></li>

                            <li>
                                <a className="dropdown-item disabled" href="#">Decline Curve (Soon)</a>
                            </li>
                        </ul>
                    </li>

                    <li className="nav-item dropdown">
                        <a className="nav-link dropdown-toggle disabled" href="#" role="button" data-bs-toggle="dropdown">
                            Production
                        </a>
                        <ul className="dropdown-menu">
                            <li><a className="dropdown-item" href="#">IPR / VLP</a></li>
                        </ul>
                    </li>

                    <li className="nav-item"><a className="nav-link disabled" href="#">Well Log</a></li>
                    <li className="nav-item"><a className="nav-link disabled" href="#">Drilling</a></li>
                </ul>
            </div>
        </div>
      </nav>

      <div className="container-fluid px-4">
        
        {/* TITLE */}
        <div className="row mb-4">
          <div className="col-12">
            <h2 className="fw-bold text-dark"><i className="bi bi-graph-up"></i> Material Balance Analysis</h2>
            <p className="text-muted">Havlena-Odeh Method: Determine OOIP (N), Gas Cap (m), and Drive Mechanism.</p>
          </div>
        </div>

        <div className="row g-3">
          
          {/* KOLOM KIRI: INPUT */}
          <div className="col-lg-7">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-header bg-primary text-white">
                <i className="bi bi-sliders"></i> Reservoir Data
              </div>
              <div className="card-body">
                
                {/* 1. SCENARIO SELECTOR */}
                <h6 className="fw-bold text-success mb-2">1. Analysis Strategy</h6>
                <select 
                  className="form-select form-select-sm mb-3" 
                  value={scenario} 
                  onChange={e => setScenario(e.target.value)}
                >
                  {/* VALUE HARUS SAMA PERSIS DENGAN ENUM PYTHON */}
                  <option value="F vs Eo">Scenario 1: F vs Eo (No Gas Cap)</option>
                  <option value="F vs (Eo + mEg)">Scenario 2: F vs (Eo + mEg) (Input m)</option>
                  <option value="F/Eo vs Eg/Eo">Scenario 3: F/Eo vs Eg/Eo (Find m)</option>
                  <option value="F vs Total Expansion">Scenario 4: General Check</option>
                </select>

                {/* 2. PROPERTIES INPUT */}
                <h6 className="fw-bold text-primary mb-2">2. Reservoir Properties</h6>
                <div className="row g-2 mb-3">
                  <div className="col-4">
                    <label className="small text-muted">Pi (psia)</label>
                    <input type="number" className="form-control form-control-sm" value={props.pi} onChange={e => updateProp('pi', e.target.value)} />
                  </div>
                  <div className="col-4">
                    <label className="small text-muted">Boi</label>
                    <input type="number" className="form-control form-control-sm" value={props.boi} onChange={e => updateProp('boi', e.target.value)} />
                  </div>
                  <div className="col-4">
                    <label className="small text-muted">m (GasCap)</label>
                    <input 
                      type="number" 
                      className="form-control form-control-sm" 
                      value={props.m} 
                      onChange={e => updateProp('m', e.target.value)} 
                      // Disable jika Scenario 1 (No Gas Cap)
                      disabled={scenario === "F vs Eo"}
                    />
                  </div>
                  {/* ... Sisa input (Rsoi, Bgi, Swc) ... */}
                  <div className="col-4"><label className="small text-muted">Rsoi</label><input type="number" className="form-control form-control-sm" value={props.rsoi} onChange={e => updateProp('rsoi', e.target.value)}/></div>
                  <div className="col-4"><label className="small text-muted">Bgi</label><input type="number" className="form-control form-control-sm" value={props.bgi} onChange={e => updateProp('bgi', e.target.value)} /></div>
                  <div className="col-4"><label className="small text-muted">Swc</label><input type="number" className="form-control form-control-sm" value={props.swc} onChange={e => updateProp('swc', e.target.value)} disabled={scenario === "F vs Eo" || scenario === "F vs (Eo + mEg)" || scenario === "F/Eo vs Eg/Eo"}/></div>
                  <div className="col-4"><label className="small text-muted">Cf</label><input type="number" className="form-control form-control-sm" value={props.cf} onChange={e => updateProp('cf', e.target.value)} disabled={scenario === "F vs Eo" || scenario === "F vs (Eo + mEg)" || scenario === "F/Eo vs Eg/Eo"}/> </div>
                  <div className="col-4"><label className="small text-muted">Cw</label><input type="number" className="form-control form-control-sm" value={props.cw} onChange={e => updateProp('cw', e.target.value)} disabled={scenario === "F vs Eo" || scenario === "F vs (Eo + mEg)" || scenario === "F/Eo vs Eg/Eo"}/> </div>
                </div>

                {/* 3. HISTORY TABLE */}
                <div className="d-flex justify-content-between align-items-center mb-2">
                   <h6 className="fw-bold text-dark mb-0">3. Production History</h6>
                   <div>
                     <button onClick={removeRow} className="btn btn-xs btn-outline-danger py-0 me-1">-</button>
                     <button onClick={addRow} className="btn btn-xs btn-outline-secondary py-0">+ Row</button>
                   </div>
                </div>
                
                <div className="table-responsive border rounded mb-3" style={{ maxHeight: '300px' }}>
                  <table className="table table-sm table-striped table-hover mb-0" style={{ fontSize: '0.8rem' }}>
                    <thead className="table-light sticky-top">
                      <tr><th>Pres</th><th>Np</th><th>Gp</th><th>Wp</th><th>Bo</th><th>Bg</th><th>Bw</th><th>Rso</th></tr>
                    </thead>
                    <tbody>
                      {history.map((row, i) => (
                        <tr key={i}>
                          <td className="p-0"><input type="number" className="form-control form-control-sm border-0" value={row.pressure} onChange={e => updateHistory(i, 'pressure', e.target.value)} /></td>
                          <td className="p-0"><input type="number" className="form-control form-control-sm border-0" value={row.np} onChange={e => updateHistory(i, 'np', e.target.value)} /></td>
                          <td className="p-0"><input type="number" className="form-control form-control-sm border-0" value={row.gp} onChange={e => updateHistory(i, 'gp', e.target.value)} /></td>
                          <td className="p-0"><input type="number" className="form-control form-control-sm border-0" value={row.wp} onChange={e => updateHistory(i, 'wp', e.target.value)} /></td>
                          <td className="p-0"><input type="number" className="form-control form-control-sm border-0" value={row.bo} onChange={e => updateHistory(i, 'bo', e.target.value)} /></td>
                          <td className="p-0"><input type="number" className="form-control form-control-sm border-0" value={row.bg} onChange={e => updateHistory(i, 'bg', e.target.value)} /></td>
                          <td className="p-0"><input type="number" className="form-control form-control-sm border-0" value={row.bw} onChange={e => updateHistory(i, 'bw', e.target.value)} /></td>
                          <td className="p-0"><input type="number" className="form-control form-control-sm border-0" value={row.rso} onChange={e => updateHistory(i, 'rso', e.target.value)} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <button 
                  className="btn btn-success w-100 fw-bold py-2 shadow-sm"
                  onClick={handleCalculate}
                  disabled={loading}
                >
                  {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-cpu me-2"></i>}
                  {loading ? "CALCULATING..." : "RUN ANALYSIS"}
                </button>
              </div>
            </div>
          </div>

          {/* KOLOM TENGAH: CHART */}
          <div className="col-lg-5">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-header bg-dark text-white">
                <i className="bi bi-display"></i> Havlena-Odeh Plot
              </div>
              <div className="card-body bg-white d-flex flex-column justify-content-center align-items-center">
                {result ? (
                  <HavlenaChart data={result.results} scenario={scenario} />
                ) : (
                  <div className="text-center text-muted opacity-50">
                    <i className="bi bi-bar-chart-line fs-1"></i>
                    <p className="mt-2">Input data and click Run Analysis</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* KOLOM KANAN: RESULTS */}
          <div className="col-lg-7">
            
            {/* MAIN RESULT: OOIP (N) */}
            <div className="card shadow-sm border-0 mb-3" style={{ borderLeft: '5px solid #0d6efd' }}>
              <div className="card-body">
                <h6 className="text-muted text-uppercase small mb-1">Original Oil In Place (N)</h6>
                <h2 className="fw-bold text-primary mb-0">
                  {result ? (result.results.N / 1e6).toFixed(2) : "-"}
                </h2>
                <small className="text-secondary">MMSTB</small>
                <hr className="my-2"/>
                
                {/* Result: Gas Cap (m) */}
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted small">Gas Cap (m)</span>
                  <strong className="text-dark">
                    {/* Handle Nullable m */}
                    {result && result.results.m !== null ? result.results.m.toFixed(3) : (scenario === "F vs Eo" ? "0 (Assumed)" : "-")}
                  </strong>
                </div>

                {/* Result: R-Squared */}
                <div className="d-flex justify-content-between">
                  <span className="text-muted small">R-Squared</span>
                  <strong className="text-success">
                    {result ? result.results.r_squared.toFixed(4) : "-"}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* DRIVE MECHANISM */}
          <div className="col-lg-5">
            <div className="card shadow-sm border-0">
              <div className="card-header bg-warning text-dark border-0">
                <i className="bi bi-speedometer2"></i> Drive Mechanism
              </div>
              <div className="card-body">
                <div className="text-center mb-3">
                  <span className="badge bg-dark text-white w-100 py-2">
                    {result && result.drive_indices ? result.drive_indices.dominant_mechanism : "UNKNOWN"}
                  </span>
                </div>
                
                {result && result.drive_indices ? (
                  <>
                    {renderProgressBar("Depletion (DDI)", result.drive_indices.DDI, "primary")}
                    {renderProgressBar("Gas Cap (SDI)", result.drive_indices.SDI, "danger")}
                    {renderProgressBar("Water Drive (WDI)", result.drive_indices.WDI, "info")}
                  </>
                ) : (
                  <p className="text-center text-muted small">No data yet.</p>
                )}
              </div>
          </div>   
            

          </div>
        </div>
      </div>
    </div>
  );
}