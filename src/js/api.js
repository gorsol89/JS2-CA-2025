// src/js/api.js
export const BASE = import.meta.env.VITE_API_BASE;
export const API_KEY = import.meta.env.VITE_API_KEY;

export function authHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'X-Noroff-API-Key': API_KEY
  };
}
