import { fetchAuth, fetchSocial } from './api.js';

const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const overlay = document.getElementById('loadingOverlay');

if (registerForm) {
  registerForm.addEventListener('submit', async e => {
    e.preventDefault();
    const { name, email, password, bio, avatar, banner } = e.target.elements;
    try {
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
      console.log("Register response:", user);
      // Try to save both possible return formats:
      if (user && (user.name || (user.data && user.data.name))) {
        localStorage.setItem('username', user.name || user.data?.name);
      }
      window.location.href = 'profile.html';
    } catch (err) {
      alert('Registrering feilet. Prøv igjen!');
    }
  });
}

if (loginForm) {
  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const { email, password } = e.target.elements;
    try {
      const data = await fetchAuth('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: email.value.trim(),
          password: password.value,
        }),
      });
      // Debug log: what do we get back from the API?
      console.log("Login response:", data);
      console.log("accessToken from login:", data.accessToken, data?.data?.accessToken);
      console.log("name from login:", data.name, data?.data?.name);

      // Try both flat and nested return objects:
      const accessToken = data.accessToken || data?.data?.accessToken;
      const username    = data.name        || data?.data?.name;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('username', username);

      // Debug: confirm what is in localStorage
      console.log("Saved accessToken:", localStorage.getItem('accessToken'));
      console.log("Saved username:", localStorage.getItem('username'));

      window.location.href = 'profile.html';
    } catch (err) {
      alert('Innlogging feilet. Prøv igjen!');
    }
  });
}
