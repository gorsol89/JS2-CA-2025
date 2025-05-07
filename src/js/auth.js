// src/js/auth.js
import { fetchAuth, fetchSocial } from './api.js';

const registerForm = document.getElementById('registerForm');
const loginForm    = document.getElementById('loginForm');

// — Register —
if (registerForm) {
  registerForm.addEventListener('submit', async e => {
    e.preventDefault();
    const { name, email, password, bio, avatar, banner } = e.target.elements;
    try {
      await fetchAuth('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name:     name.value.trim(),
          email:    email.value.trim(),
          password: password.value,
          bio:      bio.value.trim(),
          avatar:  avatar.value 
                   ? { url: avatar.value, alt: `${name.value}'s avatar` }
                   : undefined,
          banner:  banner.value 
                   ? { url: banner.value, alt: `${name.value}'s banner` }
                   : undefined
        })
      });
      // store for header swap
      if (avatar.value) localStorage.setItem('avatarURL', avatar.value);
      if (banner.value) localStorage.setItem('bannerURL', banner.value);
      window.location.href = 'index.html';
    } catch (err) {
      alert('Registration failed: ' + err.message);
    }
  });
}

// — Login —
if (loginForm) {
  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const { email, password } = e.target.elements;
    try {
      const { accessToken } = await fetchAuth('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email:    email.value.trim(),
          password: password.value
        })
      });
      localStorage.setItem('accessToken', accessToken);

      // now get API key
      const { key } = await fetchSocial('/auth/create-api-key', { method: 'POST' });
      localStorage.setItem('apiKey', key);

      window.location.href = 'feed.html';
    } catch (err) {
      alert('Login failed: ' + err.message);
    }
  });
}
