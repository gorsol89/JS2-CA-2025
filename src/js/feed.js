// src/js/feed.js
import { fetchSocial } from './api.js';

const feedContainer       = document.getElementById('feedContainer');
const postForm            = document.getElementById('postForm');
const currentUserAvatar   = document.getElementById('currentUserAvatar');
const currentUserNameElem = document.getElementById('currentUserName');
const searchForm          = document.getElementById('searchForm');
const searchInput         = document.getElementById('searchInput');
const searchResults       = document.getElementById('searchResults');

const me         = localStorage.getItem('username') || 'me';
let myUserId;             // ← will be set in loadCurrentUser()
let followingSet = new Set();

// 1) Load who you follow (by ID)
async function loadFollowing() {
  try {
    const profile = await fetchSocial(`/social/profiles/${me}?_following=true`);
    followingSet = new Set((profile.following || []).map(u => u.id));
  } catch (err) {
    console.error('Error loading following list:', err);
  }
}

// 2) Load your avatar, name & ID
async function loadCurrentUser() {
  try {
    const p = await fetchSocial(`/social/profiles/${me}`);
    myUserId = p.id;
    if (p.avatar?.url) {
      currentUserAvatar.src = p.avatar.url;
      currentUserAvatar.alt = p.avatar.alt || p.name + ' avatar';
    }
    currentUserNameElem.textContent = p.name;
    return p;
  } catch (err) {
    console.error('Error loading current user:', err);
    return null;
  }
}

// 3) Fetch feed (following + own), then render
async function loadFeed() {
  feedContainer.innerHTML = '';
  try {
    const [follows, mineRaw] = await Promise.all([
      fetchSocial('/social/posts/following?_author=true'),
      fetchSocial(`/social/profiles/${me}/posts`)
    ]);
    const profile = await loadCurrentUser();

    const mine = profile
      ? mineRaw.map(post => ({
          ...post,
          author: { id: myUserId, name: profile.name, avatar: profile.avatar || {} }
        }))
      : [];

    const all = [...follows, ...mine]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (!all.length) {
      feedContainer.textContent = 'No posts yet.';
    } else {
      all.forEach(renderPost);
    }
  } catch (err) {
    feedContainer.textContent = 'Error loading feed: ' + err.message;
  }
}

// 4) Render each post, attaching Edit/Delete only if author.id === myUserId
function renderPost(post) {
  const card = document.createElement('div');
  card.className = 'bg-white p-4 rounded-lg shadow-md';
  card.dataset.postId = post.id;

  card.innerHTML = `
    <div class="flex items-center space-x-2 mb-2">
      <img src="${post.author.avatar.url||''}"
           alt="${post.author.avatar.alt||post.author.name}"
           class="w-8 h-8 rounded-full"/>
      <span class="font-semibold text-[#5A3E28]">${post.author.name}</span>
    </div>
    ${post.media?.url
      ? `<img src="${post.media.url}" alt="${post.media.alt}"
               class="w-full max-h-96 object-cover rounded mb-2"/>`
      : ''
    }
    <h3 class="text-lg font-semibold text-[#5A3E28] mb-1">${post.title}</h3>
    <p class="post-body text-gray-700 mb-2">${post.body}</p>
  `;

  if (post.author.id === myUserId) {
    const ctrls = document.createElement('div');
    ctrls.className = 'flex space-x-4 text-sm mb-2';

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.className   = 'text-[#5A3E28] hover:text-[#F9D774]';
    editBtn.addEventListener('click', () => startEdit(card, post));

    const delBtn = document.createElement('button');
    delBtn.textContent  = 'Delete';
    delBtn.className    = 'text-[#5A3E28] hover:text-[#F9D774]';
    delBtn.addEventListener('click', () => deletePost(card, post.id));

    ctrls.append(editBtn, delBtn);
    card.appendChild(ctrls);
  }

  feedContainer.appendChild(card);
}

// 5) Create new post
postForm.addEventListener('submit', async e => {
  e.preventDefault();
  const titleInput = document.getElementById('postTitle');
  const bodyInput  = document.getElementById('postBody');
  const imgInput   = document.getElementById('postImageUrl');
  try {
    await fetchSocial('/social/posts', {
      method: 'POST',
      body: JSON.stringify({
        title: titleInput.value.trim(),
        body:  bodyInput.value.trim(),
        media: imgInput.value.trim()
          ? { url: imgInput.value.trim(), alt: 'User image' }
          : undefined
      })
    });
    alert('Post successful!');
    titleInput.value = '';
    bodyInput.value  = '';
    imgInput.value   = '';
    await loadFeed();
  } catch (err) {
    alert('Failed to create post: ' + err.message);
  }
});

// 6) Delete a post
async function deletePost(card, id) {
  if (!confirm('Delete this post?')) return;
  try {
    await fetchSocial(`/social/posts/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({})
    });
    card.remove();
    alert('Post deleted!');
  } catch (err) {
    alert('Failed to delete: ' + err.message);
  }
}

// 7) Edit a post (PUT-based, unchanged)
function startEdit(card, post) {
  /* … your existing PUT-based edit logic … */
}

// 8) Search & Follow/Unfollow by ID
searchForm.addEventListener('submit', async e => {
  e.preventDefault();
  const q = searchInput.value.trim().toLowerCase();
  searchResults.textContent = 'Searching…';

  try {
    // ← use API filtering endpoint instead of fetching everyone
    let results = await fetchSocial(`/social/profiles?name=${encodeURIComponent(q)}`);

    // no client-side filtering needed
    searchResults.innerHTML = '';
    if (!results.length) {
      searchResults.textContent = 'No users found.';
      return;
    }

    results.forEach(user => {
      const row = document.createElement('div');
      row.className = 'flex items-center justify-between bg-gray-50 p-2 rounded';

      const info = document.createElement('div');
      info.className = 'flex items-center space-x-2';
      info.innerHTML = user.avatar?.url
        ? `<img src="${user.avatar.url}" alt="${user.avatar.alt}"
                 class="w-8 h-8 rounded-full"/>`
        : `<div class="w-8 h-8 bg-gray-200 rounded-full"></div>`;
      const nameSpan = document.createElement('span');
      nameSpan.className = 'font-medium';
      nameSpan.textContent = user.name;
      info.appendChild(nameSpan);

      const btn = document.createElement('button');
      const isFollowing = followingSet.has(user.id);
      btn.textContent = isFollowing ? 'Unfollow' : 'Follow';
      btn.className = isFollowing
        ? 'text-red-500 hover:text-red-700'
        : 'text-green-500 hover:text-green-700';

      btn.addEventListener('click', async () => {
        try {
          if (isFollowing) {
            await fetchSocial(`/social/profiles/${user.id}/follow`, {
              method: 'DELETE',
              body: JSON.stringify({})
            });
            followingSet.delete(user.id);
            btn.textContent = 'Follow';
            btn.className = 'text-green-500 hover:text-green-700';
          } else {
            await fetchSocial(`/social/profiles/${user.id}/follow`, {
              method: 'POST',
              body: JSON.stringify({})
            });
            followingSet.add(user.id);
            btn.textContent = 'Unfollow';
            btn.className = 'text-red-500 hover:text-red-700';
          }
          alert(`${btn.textContent === 'Unfollow' ? 'Followed' : 'Unfollowed'} ${user.name}`);
          await loadFeed();
        } catch (err) {
          alert('Error: ' + err.message);
        }
      });

      row.append(info, btn);
      searchResults.appendChild(row);
    });
  } catch (err) {
    searchResults.textContent = 'Search failed: ' + err.message;
  }
});

// 9) Initialize everything
document.addEventListener('DOMContentLoaded', async () => {
  await loadCurrentUser();  // ensure myUserId is set
  await loadFollowing();
  await loadFeed();
});
