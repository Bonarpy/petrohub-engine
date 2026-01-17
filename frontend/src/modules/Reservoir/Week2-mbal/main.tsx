import React from 'react'
import ReactDOM from 'react-dom/client'
// Import Komponen Utama Kita
import MaterialBalancePage from './Page' 
// Import CSS Bootstrap (Wajib biar ganteng)
import 'bootstrap/dist/css/bootstrap.min.css';

// Cari div id="root" di HTML, lalu tempelkan Page kita disitu
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MaterialBalancePage />
  </React.StrictMode>,
)