// src/js/api.js

export const API_BASE = import.meta.env.VITE_API_BASE;
const DEFAULT_API_KEY = import.meta.env.VITE_NOROFF_API_KEY;

/**
 * @typedef {Object} ApiError
 * @property {string[]} errors Array of error messages from the API.
 */

/**
 * Headers for authentication endpoints (no Bearer token required).
 * @returns {{ 'Content-Type': string }}
 */
function authHeaders() {
  return { 'Content-Type': 'application/json' };
}

/**
 * Headers for all /social/* routes, including JWT and API key.
 * @returns {{ 'Content-Type': string, Authorization: string, 'X-Noroff-API-Key': string }}
 */
function socialHeaders() {
  const token  = localStorage.getItem('accessToken') || import.meta.env.VITE_BEARER_TOKEN;
  const apiKey = localStorage.getItem('apiKey')    || DEFAULT_API_KEY;

  return {
    'Content-Type':     'application/json',
    'Authorization':    `Bearer ${token}`,
    'X-Noroff-API-Key': apiKey
  };
}

/**
 * Perform a fetch against the auth endpoints (`/auth/register` and `/auth/login`).
 *
 * @param {string} path    The path under `/auth`, e.g. '/login' or '/register'
 * @param {RequestInit} [opts]  Optional fetch options (method, body, etc.)
 * @throws {Error} When the response is not ok, with concatenated API error messages.
 * @returns {Promise<any>} The `data` payload from the JSON response
 *
 * @example
 * ```js
 * const userData = await fetchAuth('/login', {
 *   method: 'POST',
 *   body: JSON.stringify({ email, password })
 * });
 * console.log(userData); // { name: 'Foxy', email: 'foxy@stud.noroff.no', accessToken: '…' }
 * ```
 */
export async function fetchAuth(path, opts = {}) {
  const res  = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: authHeaders()
  });
  const body = await res.json();
  if (!res.ok) {
    const msg = (body.errors || []).map(e => e.message).join(', ') || res.statusText;
    throw new Error(msg);
  }
  return body.data;
}

/**
 * Perform a fetch against the social endpoints (`/social/*`), automatically handling
 * JWT auth and parsing JSON (including DELETE → no-content).
 *
 * @param {string} path    The path under `/social`, e.g. '/posts' or '/profiles/{id}/follow'
 * @param {RequestInit} [opts]  Optional fetch options (method, body, etc.)
 * @throws {Error} When the response is not ok, with concatenated API error messages.
 * @returns {Promise<any|void>} The `data` payload, or void for 204/205 no-content.
 *
 * @example
 * ```js
 * // Create a new post
 * const newPost = await fetchSocial('/social/posts', {
 *   method: 'POST',
 *   body: JSON.stringify({ title, body, tags })
 * });
 * console.log(newPost.id); // the created post ID
 * ```
 */
export async function fetchSocial(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: socialHeaders()
  });

  // If DELETE/no-content, nothing to parse
  if (res.status === 204 || res.status === 205) {
    if (!res.ok) throw new Error(res.statusText);
    return;
  }

  const body = await res.json();
  if (!res.ok) {
    const msg = (body.errors || []).map(e => e.message).join(', ') || res.statusText;
    throw new Error(msg);
  }
  return body.data;
}

/**
 * Search for user profiles by partial name match.
 *
 * @param {string} name    Substring to look for in profile names.
 * @param {number} [page=1]  Which page of results to fetch.
 * @returns {Promise<Array<Object>>} Array of profile objects `{ id, name, avatar, ... }`.
 */
export async function searchProfiles(name, page = 1) {
  return fetchSocial(`/social/profiles?name=${encodeURIComponent(name)}&page=${page}`);
}

/**
 * Follow a user.
 *
 * @param {string} userId  The UUID of the user to follow.
 * @returns {Promise<void>} Resolves when the follow action completes.
 */
export async function followUser(userId) {
  return fetchSocial(`/social/profiles/${userId}/follow`, {
    method: 'POST',
    body: JSON.stringify({})
  });
}

/**
 * Unfollow a user.
 *
 * @param {string} userId  The UUID of the user to unfollow.
 * @returns {Promise<void>} Resolves when the unfollow action completes.
 */
export async function unfollowUser(userId) {
  return fetchSocial(`/social/profiles/${userId}/follow`, {
    method: 'DELETE',
    body: JSON.stringify({})
  });
}

/**
 * Get all posts for a given user.
 *
 * @param {string} userId  The UUID of the profile whose posts you want.
 * @returns {Promise<Array<Object>>} Array of post objects.
 */
export async function getUserPosts(userId) {
  return fetchSocial(`/social/profiles/${userId}/posts`);
}
