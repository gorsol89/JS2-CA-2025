// src/js/profile.js
import { fetchSocial } from './api.js';

const infoSec  = document.getElementById('profileInfo');
const postsSec = document.getElementById('profilePosts');

// show the logged-in user
const me = localStorage.getItem('username') || 'me';

async function loadProfile() {
  try {
    const profile = await fetchSocial(`/social/profiles/${me}`);
    renderProfile(profile);
    const posts   = await fetchSocial(`/social/profiles/${me}/posts`);
    renderPosts(posts);
  } catch (err) {
    infoSec.textContent = 'Error loading profile: ' + err.message;
  }
}

function renderProfile(p) {
  infoSec.innerHTML = `
    <div class="flex items-center space-x-4">
      <img src="${p.avatar.url}" alt="${p.avatar.alt}" class="w-20 h-20 rounded-full" />
      <div>
        <h2 class="text-2xl font-bold text-[#5A3E28]">${p.name}</h2>
        <p class="text-gray-600">${p.bio||''}</p>
        <p class="text-sm text-gray-500">${p.followers.length} followers • ${p.following.length} following</p>
      </div>
    </div>
  `;
}

function renderPosts(posts) {
  postsSec.innerHTML = '';
  if (!posts.length) return postsSec.textContent = 'No posts yet.';
  posts.forEach(post => {
    const c = document.createElement('div');
    c.className = 'bg-white p-4 rounded-lg shadow-md mb-4';
    c.innerHTML = `
      <img src="${post.media.url}" alt="${post.media.alt}" class="w-full rounded mb-2"/>
      <p class="text-gray-700">${post.body}</p>
    `;
    postsSec.appendChild(c);
  });
}

if (infoSec && postsSec) loadProfile();
