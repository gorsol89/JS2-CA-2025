// src/js/feed.js
import { fetchSocial } from './api.js';

const feedContainer = document.getElementById('feedContainer');

async function loadFeed() {
  try {
    // only posts from following
    const posts = await fetchSocial('/social/posts/following');
    if (!posts.length) feedContainer.textContent = 'No posts yet.';
    posts.forEach(renderPost);
  } catch (err) {
    feedContainer.textContent = 'Error loading feed: ' + err.message;
  }
}

function renderPost(post) {
  const card = document.createElement('div');
  card.className = 'bg-white p-4 rounded-lg shadow-md';
  card.innerHTML = `
    <div class="flex items-center space-x-2 mb-2">
      <img src="${post.author.avatar.url}" alt="${post.author.avatar.alt}" class="w-8 h-8 rounded-full" />
      <span class="font-semibold text-[#5A3E28]">${post.author.name}</span>
    </div>
    <img src="${post.media.url}" alt="${post.media.alt}" class="w-full max-h-96 object-cover rounded mb-2" />
    <p class="text-gray-700">${post.body}</p>
    <div class="mt-2 flex space-x-4 text-xl">
      <!-- predefined emojis -->
      ${['😹','😻','😿','🐶','🎉','♥️','🌞']
        .map(sym => `<button data-id="${post.id}" data-sym="${sym}">${sym}</button>`)
        .join('')}
    </div>
    <p class="mt-2 text-sm text-gray-500">
      ${post._count.reactions} reactions • ${post._count.comments} comments
    </p>
  `;
  feedContainer.appendChild(card);
}

document.addEventListener('DOMContentLoaded', loadFeed);
