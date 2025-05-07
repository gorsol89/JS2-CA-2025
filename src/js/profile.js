// src/js/profile.js
import { API_BASE, fetchJSON } from './api.js';

const infoSection  = document.getElementById('profileInfo');
const postsSection = document.getElementById('profilePosts');

// Determine which username to show (could parse ?user=alice)
const username = localStorage.getItem('username') || 'me';

/**
 * renderProfile(profile)
 * Renders avatar, name, bio, follower count, and follow/unfollow button.
 */
function renderProfile(profile) {
  infoSection.innerHTML = `
    <div class="flex items-center space-x-4">
      <img src="${profile.avatar}" class="w-20 h-20 rounded-full" alt="Avatar">
      <div>
        <h2 class="text-2xl font-bold text-[#5A3E28]">${profile.name}</h2>
        <p class="text-gray-600">${profile.bio || ''}</p>
        <p class="text-sm text-gray-500">${profile.followers.length} followers • ${profile.following.length} following</p>
      </div>
    </div>
    <button id="followBtn" class="mt-4 px-4 py-2 rounded-lg text-white"></button>
  `;

  const btn = document.getElementById('followBtn');
  const isMe = profile.name === localStorage.getItem('username');
  if (isMe) {
    btn.textContent = 'Edit Profile';
    btn.onclick = () => alert('Edit not implemented yet');
  } else {
    const following = profile.followers.includes(localStorage.getItem('username'));
    btn.textContent = following ? 'Unfollow' : 'Follow';
    btn.classList.toggle('bg-[#F9A8B8]', !following);
    btn.classList.toggle('bg-[#F9D774]', following);
    btn.onclick = async () => {
      const action = following ? 'unfollow' : 'follow';
      await fetchJSON(
        `${API_BASE}/social/profiles/${profile.name}/${action}`,
        { method: 'PUT' }
      );
      loadProfile(); // reload to update state
    }
  }
}

/**
 * renderPosts(posts)
 * Append each post card (reuse feed rendering if you like).
 */
function renderPosts(posts) {
  postsSection.innerHTML = '<h3 class="text-xl font-semibold text-[#5A3E28]">Posts</h3>';
  posts.forEach(post => {
    const card = document.createElement('div');
    card.className = 'bg-white p-4 rounded-lg shadow-md mb-4';
    card.innerHTML = `
      <img src="${post.media}" class="rounded mb-2" alt="Post image">
      <p class="text-gray-700">${post.body}</p>
    `;
    postsSection.appendChild(card);
  });
}

/**
 * loadProfile()
 * 1) Fetch profile data
 * 2) Render it
 * 3) Fetch user’s posts
 * 4) Render them
 */
async function loadProfile() {
  try {
    const profile = await fetchJSON(`${API_BASE}/social/profiles/${username}`);
    renderProfile(profile);

    const posts = await fetchJSON(`${API_BASE}/social/profiles/${username}/posts`);
    renderPosts(posts);
  } catch (err) {
    infoSection.textContent = 'Failed to load profile: ' + err.message;
  }
}

// Kick it off if on profile.html
if (infoSection && postsSection) {
  loadProfile();
}
