// Auth stuff for login/register 


import { fetchAuth, fetchSocial } from './api.js';

const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const overlay = document.getElementById('loadingOverlay');



if (registerForm) {
  registerForm.addEventListener('submit', async e => {
    e.preventDefault();
    const { name, email, password, bio, avatar, banner } = e.target.elements;
    try {
      // Register new user
    
      const user = await fetchAuth('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: name.value.trim(),
          email: email.value.trim(),
          password: password.value,
          bio: bio.value.trim(),
          avatar: avatar.value 
            ? { url: avatar.value, alt: `${name.value}'s avatar` }
            : undefined,
          banner: banner.value 
            ? { url: banner.value, alt: `${name.value}'s banner` }
            : undefined,
        }),
      });
      
      window.location.href = 'profile.html';
    } catch (err) {
      alert('Registrering feilet. Prøv igjen!');
      //console.error('Register error:', err);
    }
  });
}

// -- Login --
if (loginForm) {
  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    // Quick note: if this breaks, check field names!
    const { email, password } = e.target.elements;
    try {
      const data = await fetchAuth('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: email.value.trim(),
          password: password.value,
        }),
      });
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('apiKey', data.apiKey); 
      
      window.location.href = 'profile.html';
    } catch (err) {
      alert('Innlogging feilet. Prøv igjen!');
      //console.error('Login error:', err);
    }
  });
}

