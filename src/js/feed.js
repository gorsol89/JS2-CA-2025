// src/js/feed.js
import { API_BASE, fetchJSON } from './api.js';

// The container in feed.html where posts should appear
const feedContainer = document.getElementById('feedContainer');

/**
 * renderPost(post)
 * Builds a DOM element for one post:
 * - Author avatar & name
 * - Post image
 * - Body text
 * - Reaction buttons (😹😻😿🐶🎉♥️🌞)
 * - Comment button (stub for now)
 */
function renderPost(post) {
  const wrapper = document.createElement('div');
  wrapper.className = 'bg-white p-4 rounded-lg shadow-md';

  // Author block
  wrapper.innerHTML = `
    <div class="flex items-center mb-2">
      <img src="${post.owner.avatar}" class="w-10 h-10 rounded-full" alt="Avatar">
      <span class="ml-2 font-bold">${post.owner.name}</span>
    </div>
    <img src="${post.media}" class="rounded-md mb-2" alt="Post image">
    <p class="text-gray-700 mb-2">${post.body}</p>
    <div class="flex justify-between items-center">
      <div class="flex space-x-2 text-xl" id="reactions-${post.id}">
        <!-- Buttons injected below -->
      </div>
      <button class="text-blue-500">Comment</button>
    </div>
  `;

  // Add reaction buttons
  const emojis = ['😹','😻','😿','🐶','🎉','♥️','🌞'];
  const reactionsDiv = wrapper.querySelector(`#reactions-${post.id}`);
  emojis.forEach(emoji => {
    const btn = document.createElement('button');
    btn.textContent = emoji;
    btn.onclick = () => react(post.id, emoji);
    reactionsDiv.appendChild(btn);
  });

  return wrapper;
}

/**
 * loadFeed()
 * 1) Fetch posts you follow (with author data)
 * 2) Clear the container
 * 3) Append each rendered post
 */
export async function loadFeed() {
  try {
    const posts = await fetchJSON(
      `${API_BASE}/social/posts/following?_author=true`
    );
    feedContainer.innerHTML = '';            // clear old
    posts.forEach(post => {
      feedContainer.appendChild(renderPost(post));
    });
  } catch (err) {
    feedContainer.textContent = 'Failed to load feed: ' + err.message;
  }
}

/**
 * react(id, emoji)
 * Send a reaction to a post, then reload the feed counts.
 */
async function react(postId, emoji) {
  try {
    await fetchJSON(
      `${API_BASE}/social/posts/${postId}/react/${encodeURIComponent(emoji)}`,
      { method: 'PUT' }
    );
    // Optionally reload feed to fetch updated counts
    await loadFeed();
  } catch (err) {
    alert('Reaction failed: ' + err.message);
  }
}

// Initialize feed on page load
if (feedContainer) {
  loadFeed();
}
