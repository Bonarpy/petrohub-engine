// src/core/api/client.ts
import axios from 'axios';

// Kita buat instance axios khusus
const apiClient = axios.create({
  baseURL: 'https://petroapp-engine-9yfragqvfz9zwgkuhgxkrx.streamlit.app', // Alamat Backend Python Anda
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;