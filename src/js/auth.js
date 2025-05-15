// src/js/auth.js
import { fetchAuth, fetchSocial } from './api.js';

const registerForm = document.getElementById('registerForm');
const loginForm    = document.getElementById('loginForm');
const overlay      = document.getElementById('loadingOverlay');

if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    // show loading overlay
    overlay.classList.remove('hidden');

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

      console.log('Registered:', user);
      alert('Registration successful! Please log in.');

      // hide overlay and redirect
      overlay.classList.add('hidden');
      window.location.href = 'index.html';
    } catch (err) {
      console.error(err);
      overlay.classList.add('hidden');
      alert('Registration failed: ' + err.message);
    }
  });
}

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    // show loading overlay
    overlay.classList.remove('hidden');

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

      console.log('Logged in as:', name);
      alert('Login successful! Redirecting to your profile…');

      // hide overlay and redirect
      overlay.classList.add('hidden');
      window.location.href = 'profile.html';
    } catch (err) {
      console.error(err);
      overlay.classList.add('hidden');
      alert('Login failed: ' + err.message);
    }
  });
}
