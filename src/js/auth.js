// src/js/auth.js
import { API_BASE, fetchJSON } from './api.js';

const loginForm    = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

// LOGIN flow
if (loginForm) {
  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const email    = e.target.email.value;
    const password = e.target.password.value;

    try {
      // 1) Log in and get accessToken
      const { accessToken } = await fetchJSON(
        `${API_BASE}/auth/login`,
        { method: 'POST', body: JSON.stringify({ email, password }) }
      );

      // 2) Store token
      localStorage.setItem('accessToken', accessToken);

      // 3) Create & store API key
      const { key } = await fetchJSON(
        `${API_BASE}/auth/create-api-key`,
        { method: 'POST' }
      );
      localStorage.setItem('apiKey', key);

      // 4) Redirect to feed
      window.location.href = 'feed.html';
    } catch (err) {
      alert('Login failed: ' + err.message);
    }
  });
}

// REGISTER flow
if (registerForm) {
  registerForm.addEventListener('submit', async e => {
    e.preventDefault();
    const name     = e.target.name.value;
    const email    = e.target.email.value;
    const password = e.target.password.value;
    const bio      = e.target.bio.value;

    try {
      // 1) Call register endpoint
      await fetchJSON(
        `${API_BASE}/auth/register`,
        { method: 'POST', body: JSON.stringify({ name, email, password, bio }) }
      );

      // 2) On success, go back to login
      window.location.href = 'index.html';
    } catch (err) {
      alert('Registration failed: ' + err.message);
    }
  });
}
