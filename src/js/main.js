// src/js/main.js
import '../style.css';
//console.log('✅ FuzzyGallery loaded');

// — Redirect if not logged in and not on public pages:
const publicPages = ['index.html', 'register.html'];
const current     = location.pathname.split('/').pop();
if (!localStorage.getItem('accessToken') && !publicPages.includes(current)) {
  window.location.href = 'index.html';
}

// — Mobile menu toggle —
const menuBtn    = document.getElementById('menuBtn');
const mobileNav  = document.getElementById('mobileMenu');
if (menuBtn && mobileNav) {
  menuBtn.addEventListener('click', () => {
    mobileNav.classList.toggle('hidden');
  });
}

// — Logout handler (for both desktop & mobile buttons) —
document.querySelectorAll('.logoutBtn').forEach(btn => {
  btn.addEventListener('click', () => {
    // clear everything related to auth
    localStorage.removeItem('accessToken');
    localStorage.removeItem('username');
    localStorage.removeItem('apiKey');
    localStorage.removeItem('avatarURL');
    localStorage.removeItem('bannerURL');
    // send back to login
    window.location.href = 'index.html';
  });
});
