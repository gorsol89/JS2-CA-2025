// src/js/main.js
import '../style.css';
console.log('✅ FuzzyGallery loaded');

// Redirect if not logged in and not on public pages:
const publicPages = ['index.html','register.html'];
const current    = location.pathname.split('/').pop();
if (!localStorage.getItem('accessToken') && !publicPages.includes(current)) {
  window.location.href = 'index.html';
}

// Swap in avatar if set
const avatarURL = localStorage.getItem('avatarURL');
if (avatarURL) {
  const img = document.querySelector('header img');
  if (img) img.src = avatarURL;
}
