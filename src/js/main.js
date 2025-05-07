// src/js/main.js
import '../style.css';

console.log('✅ FuzzyGallery loaded');

// Optional: Redirect to login if no token and on a protected page
const publicPages = ['index.html','register.html'];
if (!localStorage.getItem('accessToken') && !publicPages.includes(location.pathname.split('/').pop())) {
  window.location.href = 'index.html';
}
