// src/js/api.js

// Noroff API base url - don't forget to set .env or stuff breaks!
export const API_BASE = import.meta.env.VITE_API_BASE;
const DEFAULT_API_KEY = import.meta.env.VITE_NOROFF_API_KEY; 

function authHeaders() {
  // Standard headers for /auth endpoints
  return { 'Content-Type': 'application/json' };
}

function socialHeaders() {
  // Not sure if apiKey is always in localStorage, fallback to default
  const token  = localStorage.getItem('accessToken') || import.meta.env.VITE_BEARER_TOKEN;
  const apiKey = localStorage.getItem('apiKey') || DEFAULT_API_KEY;
  // console.log('Using API key:', apiKey); // Debug line for testing
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'X-Noroff-API-Key': apiKey,
  };
}

export async function fetchAuth(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...authHeaders(),
        ...(options.headers || {}),
      },
    });
    if (!res.ok) {
      const { errors } = await res.json();
      throw new Error(errors ? errors[0] : 'Unknown error');
    }
    return await res.json();
  } catch (err) {
    throw err;
  }
}

export async function fetchSocial(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...socialHeaders(),
        ...(options.headers || {}),
      },
    });
    if (!res.ok) {
      const { errors } = await res.json();
      throw new Error(errors ? errors[0] : 'Unknown error');
    }
    return await res.json();
  } catch (err) {
    throw err;
  }
}

/**

JS DOCS for the api.js
/**
 * @typedef {Object} ApiError
 * @property {string[]} errors - Array of error messages from the API.
 */

/**
 * Headers for authentication endpoints (no Bearer token required).
 * @returns {{ 'Content-Type': string }}
 */

/**
 * Headers for all /social/* routes, including JWT and API key.
 * @returns {{ 'Content-Type': string, Authorization: string, 'X-Noroff-API-Key': string }}
 */

/**
 * Perform a fetch against the auth endpoints (`/auth/register` and `/auth/login`).
 *
 * @param {string} path - The path under /auth, e.g. '/login' or '/register'.
 * @param {RequestInit} [opts] - Optional fetch options (method, body, etc).
 * @returns {Promise<any>} The data payload from the JSON response.
 * @throws {Error} When the response is not ok, with concatenated API error messages.
 *
 * @example
 * const userData = await fetchAuth('/login', {
 *   method: 'POST',
 *   body: JSON.stringify({ email, password })
 * });
 * console.log(userData); // { name: 'Foxy', email: 'foxy@stud.noroff.no', accessToken: '…' }
 */

/**
 * Perform a fetch against the social endpoints (/social/*), automatically handling
 * JWT auth and parsing JSON (including DELETE → no-content).
 *
 * @param {string} path - The path under /social, e.g. '/posts' or '/profiles/{id}/follow'.
 * @param {RequestInit} [opts] - Optional fetch options (method, body, etc).
 * @returns {Promise<any|void>} The data payload, or void for 204/205 no-content.
 * @throws {Error} When the response is not ok, with concatenated API error messages.
 *
 * @example
 * // Create a new post
 * const newPost = await fetchSocial('/social/posts', {
 *   method: 'POST',
 *   body: JSON.stringify({ title, body, tags })
 * });
 * console.log(newPost.id); // the created post ID
 */

/**
 * Search for user profiles by partial name match.
 *
 * @param {string} name - Substring to look for in profile names.
 * @param {number} [page=1] - Which page of results to fetch (default: 1).
 * @returns {Promise<Object[]>} Array of profile objects.
 * @throws {Error} On API/network errors.
 */

/**
 * Follow a user.
 *
 * @param {string} userId - The UUID of the user to follow.
 * @returns {Promise<void>} Resolves when the follow action completes.
 */

/**
 * Unfollow a user.
 *
 * @param {string} userId - The UUID of the user to unfollow.
 * @returns {Promise<void>} Resolves when the unfollow action completes.
 */

/**
 * Get all posts for a given user.
 *
 * @param {string} userId - The UUID of the profile whose posts you want.
 * @returns {Promise<Object[]>} Array of post objects.
 * @throws {Error} On API/network errors.
 */
