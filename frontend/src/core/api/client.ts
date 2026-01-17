// src/core/api/client.ts
import axios from 'axios';

// Kita buat instance axios khusus
const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000', // Alamat Backend Python Anda
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;