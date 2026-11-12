import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 120000, // 2 minutes for heavy conversions/OCR
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 405) {
      return Promise.reject(new Error(
        'Backend server not connected. Vercel only hosts static frontend files. To process conversions, connect your backend by setting VITE_API_URL in your Vercel Project Settings (e.g. to a free Render/Railway backend URL).'
      ));
    }
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred.';
    return Promise.reject(new Error(message));
  }
);

export default api;
