// src/core/api/client.ts
import axios from 'axios';

// Kita buat instance axios khusus mengarah ke BE Engine yang baru
const apiClient = axios.create({
  // baseURL: 'https://petrohub-engine.vercel.app'
  baseURL: 'http://127.0.0.1:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;