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
      // Register new user (returns user profile) :contentReference[oaicite:0]{index=0}
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

      // Redirect back to login
      window.location.href = 'index.html';
    } catch (err) {
      console.error(err);
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
      // Log the user in (returns profile + accessToken) :contentReference[oaicite:1]{index=1}
      const { accessToken, name } = await fetchAuth('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email:    email.value.trim(),
          password: password.value
        })
      });

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('username', name);

      // Create/Renew API key (must send valid JSON body) :contentReference[oaicite:2]{index=2}
      const { key } = await fetchSocial('/auth/create-api-key', {
        method: 'POST',
        body: JSON.stringify({})
      });
      localStorage.setItem('apiKey', key);

      console.log('Logged in as:', name);
      alert('Login successful! Redirecting to your profile…');

      // Go to profile page
      window.location.href = 'profile.html';
    } catch (err) {
      console.error(err);
      alert('Login failed: ' + err.message);
    }
  });
}
