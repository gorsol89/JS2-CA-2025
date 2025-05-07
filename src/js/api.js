// src/js/api.js

// Base URL for Noroff Social API (from your .env.local)
export const API_BASE = import.meta.env.VITE_API_BASE;

// Your Noroff API Key and fallback token (also from .env.local)
const API_KEY    = import.meta.env.VITE_NOROFF_API_KEY;
const FALLBACK_TOKEN = import.meta.env.VITE_BEARER_TOKEN;

/**
 * getHeaders()
 * Returns the standard headers required for every protected request:
 * - Content-Type: application/json
 * - X-Noroff-API-Key: your public API key
 * - Authorization: Bearer <token>
 *    token is pulled from localStorage if set, else FALLBACK_TOKEN
 */
export function getHeaders() {
  const token = localStorage.getItem('accessToken') || FALLBACK_TOKEN;
  return {
    'Content-Type': 'application/json',
    'X-Noroff-API-Key': API_KEY,
    'Authorization': `Bearer ${token}`
  };
}

/**
 * fetchJSON(url, opts)
 * Shorthand to call fetch with our headers, parse JSON, and
 * throw on non-OK status.
 */
export async function fetchJSON(url, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: getHeaders()
  });
  const payload = await res.json();
  if (!res.ok) {
    // API errors usually in payload.errors (array) or payload.error
    const msg = payload.errors?.join(', ') || payload.error || res.statusText;
    throw new Error(msg);
  }
  return payload.data;
}
