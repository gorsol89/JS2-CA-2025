// src/js/profile.js
import { fetchSocial } from './api.js';

const infoSec  = document.getElementById('profileInfo');
const postsSec = document.getElementById('profilePosts');
const me       = localStorage.getItem('username') || 'me';

async function loadProfile() {
  try {
    // Fetch profile with both followers & following arrays
    const p = await fetchSocial(
      `/social/profiles/${me}?_followers=true&_following=true`
    );
    renderProfile(p);

    const posts = await fetchSocial(`/social/profiles/${me}/posts`);
    renderPosts(posts);
  } catch (err) {
    infoSec.textContent = 'Error loading profile: ' + err.message;
  }
}

function renderProfile(p) {
  // build comma-separated lists (or "None")
  const followerNames  = (p.followers  || []).map(u => u.name).join(', ') || 'None';
  const followingNames = (p.following  || []).map(u => u.name).join(', ') || 'None';

  infoSec.innerHTML = `
    ${p.banner?.url
      ? `<div class="h-48 overflow-hidden">
           <img src="${p.banner.url}"
                alt="${p.banner.alt || p.name + ' banner'}"
                class="w-full h-full object-cover" />
         </div>`
      : ``
    }
    <div class="relative px-6 pt-16 pb-6 bg-white ${p.banner?.url ? '-mt-12' : ''}">
      <div class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <img src="${p.avatar?.url || ''}"
             alt="${p.avatar?.alt || p.name + ' avatar'}"
             class="w-24 h-24 rounded-full border-4 border-white"/>
      </div>
      <div class="text-center">
        <h2 class="text-2xl font-bold text-[#5A3E28]">${p.name}</h2>
        <p class="mt-2 text-sm text-gray-500">${p.email}</p>
        ${p.bio ? `<p class="mt-2 text-gray-600">${p.bio}</p>` : ''}
        <p class="mt-4 text-sm text-gray-500">
          ${p.followers.length} followers • ${p.following.length} following
        </p>
        <p class="mt-2 text-sm text-gray-500">
          <strong>Followers:</strong> ${followerNames}
        </p>
        <p class="text-sm text-gray-500">
          <strong>Following:</strong> ${followingNames}
        </p>
      </div>
    </div>
  `;
}

function renderPosts(posts) {
  postsSec.innerHTML = '';
  if (!posts.length) {
    postsSec.textContent = 'No posts yet.';
    return;
  }
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
