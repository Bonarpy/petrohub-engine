import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css'; // Load Bootstrap CSS

// Import App lokal milik Week 3
// Pastikan nama file App.tsx atau Page.tsx sesuai dengan yang Anda buat sebelumnya
import HavlenaOdehPage from './Page'; 

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HavlenaOdehPage />
  </React.StrictMode>,
);