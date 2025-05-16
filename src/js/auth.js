// src/js/auth.js
import { fetchAuth, fetchSocial } from './api.js';

const registerForm = document.getElementById('registerForm');
const loginForm    = document.getElementById('loginForm');
const overlay      = document.getElementById('loadingOverlay');

// REGISTER
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    // show loading overlay if present
    if (overlay) overlay.classList.remove('hidden');

    const { name, email, password, bio, avatar, banner } = e.target.elements;
    try {
      // Register new user (returns user profile)
      const user = await fetchAuth('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name:     name.value.trim(),
          email:    email.value.trim(),
          password: password.value,
          bio:      bio.value.trim(),
          avatar:   avatar.value
                     ? { url: avatar.value, alt: `${name.value}'s avatar` }
                     : undefined,
          banner:   banner.value
                     ? { url: banner.value, alt: `${name.value}'s banner` }
                     : undefined
        })
      });

      // Hide overlay and redirect to register-success page
      if (overlay) overlay.classList.add('hidden');
      window.location.href = 'register-success.html';
    } catch (err) {
      console.error(err);
      if (overlay) overlay.classList.add('hidden');
      alert('Registration failed: ' + err.message);
    }
  });
}

// LOGIN
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    // show loading overlay if present
    if (overlay) overlay.classList.remove('hidden');

    const { email, password } = e.target.elements;
    try {
      // Log the user in (returns profile + accessToken)
      const { accessToken, name } = await fetchAuth('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email:    email.value.trim(),
          password: password.value
        })
      });

      // store tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('username',   name);

      // Create/Renew API key
      const { key } = await fetchSocial('/auth/create-api-key', {
        method: 'POST',
        body: JSON.stringify({})
      });
      localStorage.setItem('apiKey', key);

      // hide overlay and redirect to FEED (no alerts)
      if (overlay) overlay.classList.add('hidden');
      window.location.href = 'feed.html';
    } catch (err) {
      console.error(err);
      if (overlay) overlay.classList.add('hidden');
      alert('Login failed: ' + err.message);
    }
  });
}
