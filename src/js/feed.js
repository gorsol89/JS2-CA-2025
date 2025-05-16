// src/js/feed.js

import { fetchSocial } from './api.js';

const feedContainer       = document.getElementById('feedContainer');
const postForm            = document.getElementById('postForm');
const currentUserAvatar   = document.getElementById('currentUserAvatar');
const currentUserNameElem = document.getElementById('currentUserName');
const filterSearch        = document.getElementById('filterSearch');
const sortSelect          = document.getElementById('sortSelect');
const tagInput            = document.getElementById('tagInput');
const tagBtn              = document.getElementById('tagBtn');
const toastElem           = document.getElementById('toast');

const me         = localStorage.getItem('username') || 'me';
let myUserId;
let followingSet = new Set();

const EMOJI_LIST = ['🐱', '😻', '❤️', '😂', '👍', '😮'];

// Load who you follow (by username)
async function loadFollowing() {
  try {
    const profile = await fetchSocial(`/social/profiles/${me}?_following=true`);
    followingSet = new Set((profile.following || []).map(u => u.name));
    followingSet.add(me); // Always include self
    localStorage.setItem('followingSet', JSON.stringify([...followingSet]));
  } catch (err) {
    followingSet = new Set([me]);
    console.error('Error loading following:', err);
  }
}

// Load current user info
async function loadCurrentUser() {
  try {
    const profile = await fetchSocial(`/social/profiles/${me}`);
    myUserId = profile.id;
    currentUserAvatar.src = profile.avatar?.url || '/catinbox.png';
    currentUserAvatar.alt = profile.avatar?.alt || 'Avatar';
    currentUserNameElem.textContent = profile.name || me;
  } catch (err) {
    currentUserNameElem.textContent = me;
  }
}

// Toast notification
function showToast(message, color = '#A8E0FF') {
  if (!toastElem) return;
  toastElem.textContent = message;
  toastElem.style.background = color;
  toastElem.classList.remove('hidden');
  toastElem.style.opacity = '1';
  setTimeout(() => {
    toastElem.style.opacity = '0';
    setTimeout(() => toastElem.classList.add('hidden'), 400);
  }, 1800);
}

// Filtering & Sorting events
if (filterSearch) filterSearch.addEventListener('input', () => loadFeed());
if (sortSelect)   sortSelect.addEventListener('change', () => loadFeed());
if (tagBtn)       tagBtn.addEventListener('click', e => { e.preventDefault(); loadFeed(); });

// New post handler
if (postForm) {
  postForm.addEventListener('submit', async e => {
    e.preventDefault();
    const title   = document.getElementById('postTitle').value.trim();
    const body    = document.getElementById('postBody').value.trim();
    const image   = document.getElementById('postImageUrl').value.trim();
    const alt     = document.getElementById('postImageAlt').value.trim();
    const tags    = document.getElementById('postTags').value.trim();
    if (!title || !body) return;
    try {
      const newPost = {
        title,
        body,
        media: image ? { url: image, alt: alt || title } : undefined,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean)
      };
      await fetchSocial('/social/posts', {
        method: 'POST',
        body: JSON.stringify(newPost)
      });
      postForm.reset();
      await loadFeed();
    } catch (err) {
      alert('Failed to create post');
    }
  });
}

// Main Load Feed: posts from following + yourself
async function loadFeed() {
  try {
    // Always use the server sort for 'created:desc', fallback for others
    let url = '/social/posts?_author=true&_reactions=true&_comments=true&sort=created&sortOrder=desc';
    let posts = await fetchSocial(url);

    // Only posts from following + yourself
    posts = posts.filter(post => followingSet.has(post.author?.name));

    // Filter by search text in title/body
    const searchText = filterSearch?.value.trim().toLowerCase() || '';
    if (searchText) {
      posts = posts.filter(post =>
        post.title?.toLowerCase().includes(searchText) ||
        post.body?.toLowerCase().includes(searchText)
      );
    }
    // Filter by tag
    const tag = tagInput?.value.trim().toLowerCase() || '';
    if (tag) {
      posts = posts.filter(post =>
        (post.tags || []).some(t => t.toLowerCase() === tag)
      );
    }

    // Client-side sort
    const sort = sortSelect?.value || 'created:desc';
    let [sortField, sortDir] = sort.split(':');
    if (sortField === 'title') {
      posts = posts.sort((a, b) => {
        if (!a.title) return 1;
        if (!b.title) return -1;
        if (sortDir === 'asc') {
          return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
        } else {
          return b.title.localeCompare(a.title, undefined, { sensitivity: 'base' });
        }
      });
    } else if (sortField === 'created' && sortDir === 'asc') {
      // Oldest first: sort by date client-side (since API is desc only)
      posts = posts.sort((a, b) => new Date(a.created) - new Date(b.created));
    } // If desc: already sorted by API

    renderFeed(posts);
  } catch (err) {
    feedContainer.innerHTML = '<div class="text-red-500">Failed to load feed.</div>';
  }
}

// Render Feed with Emoji, Edit, Delete, and Comment
function renderFeed(posts) {
  if (!posts.length) {
    feedContainer.innerHTML = '<div class="text-gray-500">No posts found.</div>';
    return;
  }
  feedContainer.innerHTML = posts.map(renderPost).join('');
  addFeedEvents(posts);
}

// Render post with reactions, comment form, edit/delete for own posts
function renderPost(post) {
  const emojiBtns = EMOJI_LIST.map(emoji => {
    const reactionObj = (post.reactions || []).find(r => r.symbol === emoji);
    const count = reactionObj?.count || 0;
    return `
      <button class="emoji-btn px-1" data-post="${post.id}" data-emoji="${emoji}" title="React with ${emoji}">
        ${emoji} <span class="emoji-count text-xs">${count > 0 ? count : ''}</span>
      </button>
    `;
  }).join('');
  const isMine = post.author?.name === me;
  const controls = isMine
    ? `
      <button class="edit-btn text-[#5A3E28] hover:text-[#F9D774] mr-2" data-post="${post.id}">Edit</button>
      <button class="delete-btn text-[#5A3E28] hover:text-[#F9D774]" data-post="${post.id}">Delete</button>
    `
    : '';
  const commentsHtml = post.comments?.length
    ? `<ul class="space-y-1 text-sm mb-2">
        ${post.comments.map(c =>
          `<li><strong>${c.owner}</strong>: ${c.body}</li>`
        ).join('')}
      </ul>`
    : '<div class="text-xs text-gray-400 mb-2">No comments yet.</div>';
  const commentForm = `
    <form class="comment-form flex gap-2 mt-1" data-post="${post.id}">
      <input type="text" name="comment" placeholder="Write a comment…" required
        class="flex-grow p-1 border border-[#5A3E28] rounded text-sm" />
      <button type="submit"
        class="bg-[#A8E0FF] hover:bg-[#F9D774] text-[#5A3E28] px-2 rounded font-semibold text-sm">
        Post
      </button>
    </form>
  `;
  // Outer clickable wrapper, except buttons/forms
  return `
    <div class="bg-white p-6 rounded-lg shadow-md group relative post-card cursor-pointer hover:bg-[#A8E0FF]/20 transition"
         data-id="${post.id}">
      <div class="absolute inset-0 z-10"></div>
      <div class="flex items-center space-x-3 mb-2">
        <img src="${post.author?.avatar?.url || '/catinbox.png'}" alt="avatar" class="w-8 h-8 rounded-full"/>
        <span class="font-semibold text-[#5A3E28]">${post.author?.name || 'User'}</span>
        <span class="text-xs text-gray-400 ml-auto">${new Date(post.created).toLocaleString()}</span>
      </div>
      <h3 class="font-bold text-lg mb-1">${post.title}</h3>
      <p class="mb-2">${post.body}</p>
      ${post.media?.url ? `<img src="${post.media.url}" alt="${post.media.alt || 'Image'}" class="w-full max-h-80 object-contain rounded my-2" />` : ''}
      ${post.tags?.length ? `<div class="mb-2 text-sm text-gray-400">Tags: ${post.tags.map(t => `<span class="mr-2">#${t}</span>`).join('')}</div>` : ''}
      <div class="flex items-center gap-2 my-2">${emojiBtns}</div>
      <div>${controls}</div>
      ${commentsHtml}
      ${commentForm}
    </div>
  `;
}

// Events for reactions, edit, delete, comment, and post click
function addFeedEvents(posts) {
  // Handle click to post detail
  document.querySelectorAll('.post-card').forEach(card => {
    // Only navigate if NOT clicking on a button or inside a form
    card.addEventListener('click', function (e) {
      // Prevent if clicking inside comment form, edit, delete, emoji etc.
      if (
        e.target.closest('form') ||
        e.target.closest('button') ||
        e.target.tagName === 'BUTTON' ||
        e.target.classList.contains('emoji-btn') ||
        e.target.classList.contains('edit-btn') ||
        e.target.classList.contains('delete-btn')
      ) return;
      const postId = card.getAttribute('data-id');
      if (postId) {
        window.location.href = `post.html?id=${postId}`;
      }
    });
  });

  document.querySelectorAll('.emoji-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const postId = btn.dataset.post;
      const emoji  = btn.dataset.emoji;
      try {
        await fetchSocial(`/social/posts/${postId}/react/${encodeURIComponent(emoji)}`, {
          method: 'PUT',
          body: JSON.stringify({ symbol: emoji })
        });
        await loadFeed();
      } catch (err) {
        alert('Failed to react');
      }
    });
  });
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const postId = btn.dataset.post;
      if (!confirm('Delete this post?')) return;
      try {
        await fetchSocial(`/social/posts/${postId}`, { method: 'DELETE' });
        await loadFeed();
      } catch (err) {
        alert('Failed to delete post');
      }
    });
  });
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const postId = btn.dataset.post;
      const post = posts.find(p => `${p.id}` === postId);
      startEditPost(post);
    });
  });
  document.querySelectorAll('.comment-form').forEach(form => {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const postId = form.dataset.post;
      const input = form.querySelector('input[name="comment"]');
      const body = input.value.trim();
      if (!body) return;
      try {
        await fetchSocial(`/social/posts/${postId}/comment`, {
          method: 'POST',
          body: JSON.stringify({ body })
        });
        input.value = '';
        await loadFeed();
      } catch (err) {
        alert('Failed to add comment');
      }
    });
  });
}

// Inline Edit
function startEditPost(post) {
  const postDiv = document.querySelector(`[data-id="${post.id}"]`);
  if (!postDiv) return;
  postDiv.innerHTML = '';
  const form = document.createElement('form');
  form.className = 'space-y-4';
  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.value = post.title;
  titleInput.required = true;
  titleInput.className = 'w-full p-2 border border-[#5A3E28] rounded focus:ring-1 focus:ring-[#F9A8B8]';
  const bodyInput = document.createElement('textarea');
  bodyInput.rows = 4;
  bodyInput.value = post.body;
  bodyInput.required = true;
  bodyInput.className = 'w-full p-2 border border-[#5A3E28] rounded focus:ring-1 focus:ring-[#F9D774]';
  const urlInput = document.createElement('input');
  urlInput.type = 'url';
  urlInput.value = post.media?.url || '';
  urlInput.placeholder = 'Image URL (optional)';
  urlInput.className = 'w-full p-2 border border-[#5A3E28] rounded focus:ring-1 focus:ring-[#F9A8B8]';
  const altInput = document.createElement('input');
  altInput.type = 'text';
  altInput.value = post.media?.alt || '';
  altInput.placeholder = 'Image Alt Text (optional)';
  altInput.className = 'w-full p-2 border border-[#5A3E28] rounded focus:ring-1 focus:ring-[#F9A8B8]';
  const tagsInput = document.createElement('input');
  tagsInput.type = 'text';
  tagsInput.value = (post.tags || []).join(', ');
  tagsInput.placeholder = 'Tags (comma-separated)';
  tagsInput.className = 'w-full p-2 border border-[#5A3E28] rounded focus:ring-1 focus:ring-[#F9A8B8]';
  const btnContainer = document.createElement('div');
  btnContainer.className = 'flex gap-2';
  const saveBtn = document.createElement('button');
  saveBtn.type = 'submit';
  saveBtn.textContent = 'Save';
  saveBtn.className = 'bg-[#A8E0FF] hover:bg-[#F9D774] text-[#5A3E28] py-2 px-4 rounded-lg font-semibold';
  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.className = 'bg-[#F9A8B8] hover:bg-[#F9D774] text-[#5A3E28] py-2 px-4 rounded-lg font-semibold';
  cancelBtn.onclick = (e) => { e.preventDefault(); loadFeed(); };
  btnContainer.append(saveBtn, cancelBtn);
  form.append(titleInput, bodyInput, urlInput, altInput, tagsInput, btnContainer);
  postDiv.appendChild(form);
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const updated = {
      title: titleInput.value.trim(),
      body: bodyInput.value.trim(),
      media: urlInput.value.trim()
        ? { url: urlInput.value.trim(), alt: altInput.value.trim() }
        : undefined,
      tags: tagsInput.value
        ? tagsInput.value.split(',').map(t => t.trim()).filter(Boolean)
        : []
    };
    try {
      await fetchSocial(`/social/posts/${post.id}`, {
        method: 'PUT',
        body: JSON.stringify(updated)
      });
      await loadFeed();
    } catch (err) {
      alert('Failed to save changes');
    }
  });
}

// Initial Load
(async function() {
  await loadCurrentUser();
  await loadFollowing();
  await loadFeed();
})();
