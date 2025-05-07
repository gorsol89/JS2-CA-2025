// src/js/api.js

export const API_BASE = import.meta.env.VITE_API_BASE;
const DEFAULT_API_KEY = import.meta.env.VITE_NOROFF_API_KEY;

// For /auth/register and /auth/login
function authHeaders() {
  return { 'Content-Type': 'application/json' };
}

// For all /social/* routes
function socialHeaders() {
  const token  = localStorage.getItem('accessToken') || import.meta.env.VITE_BEARER_TOKEN;
  const apiKey = localStorage.getItem('apiKey')    || DEFAULT_API_KEY;

  return {
    'Content-Type':     'application/json',
    'Authorization':    `Bearer ${token}`,
    'X-Noroff-API-Key': apiKey
  };
}

export async function fetchAuth(path, opts = {}) {
  const res  = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: authHeaders()
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.errors?.map(e=>e.message).join(', ') || res.statusText);
  return body.data;
}

export async function fetchSocial(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: socialHeaders()
  });

  // If no content (DELETE), don't parse JSON
  if (res.status === 204 || res.status === 205) {
    if (!res.ok) throw new Error(res.statusText);
    return;
  }

  const body = await res.json();
  if (!res.ok) throw new Error(body.errors?.map(e=>e.message).join(', ') || res.statusText);
  return body.data;
}
