import {
  fetchSocial,
  searchProfiles,
  followUser,
  unfollowUser
} from './api.js';

console.log('❯ feed.js loaded');

let allPosts       = [];     // in‐memory cache of posts
let currentFilter  = 'all';  // 'all' | 'mine' | '1day' | '7days'
let myUserId;
let followingSet   = new Set();
const me           = localStorage.getItem('username') || 'me';

// DOM refs
const feedContainer       = document.getElementById('feedContainer');
const currentUserAvatar   = document.getElementById('currentUserAvatar');
const currentUserNameElem = document.getElementById('currentUserName');
const postForm            = document.getElementById('postForm');
const searchForm          = document.getElementById('searchForm');
const searchInput         = document.getElementById('searchInput');
const searchResults       = document.getElementById('searchResults');
const filterButtons       = document.getElementById('filterButtons');
const filterSearch        = document.getElementById('filterSearch');

console.log('DOM refs:', {
  feedContainer,
  currentUserAvatar,
  currentUserNameElem,
  postForm,
  searchForm,
  filterButtons,
  filterSearch
});

// Helper to grab whichever "id" field exists
function getId(obj) {
  if (obj.id) return obj.id;
  if (obj._id) return obj._id;
  if (obj.attributes?.id) return obj.attributes.id;
  return null;
}

// ————————————————
// RENDER SINGLE POST
// ————————————————
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
    ${post.media?.url ? `
      <img src="${post.media.url}" alt="${post.media.alt}"
           class="w-full max-h-96 object-cover rounded mb-2"/>
    ` : ''}
    <h3 class="text-lg font-semibold text-[#5A3E28] mb-1">${post.title}</h3>
    <p class="post-body text-gray-700 mb-2">${post.body}</p>
  `;

  // Edit/Delete for own posts
  if (post.author.id === myUserId) {
    const ctrls = document.createElement('div');
    ctrls.className = 'flex space-x-4 text-sm mb-2';
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.className = 'text-[#5A3E28] hover:text-[#F9D774]';
    editBtn.onclick = () => startEdit(card, post);
    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    delBtn.className = 'text-[#5A3E28] hover:text-[#F9D774]';
    delBtn.onclick = () => deletePost(card, post.id);
    ctrls.append(editBtn, delBtn);
    card.appendChild(ctrls);
  }

  // Reactions bar
  const reactionsBar = document.createElement('div');
  reactionsBar.className = 'post-reactions flex items-center space-x-2 mb-2';
  reactionsBar.innerHTML = `<label class="font-medium">React:</label>`;
  ['🤣','🎉','🐶','❤️','👍','👏','😻','😿'].forEach(symbol => {
    const btn = document.createElement('button');
    btn.textContent = symbol;
    btn.className = 'emoji-btn text-xl';
    btn.onclick = async () => {
      console.log('React:', symbol, 'post', post.id);
      await fetchSocial(
        `/social/posts/${post.id}/react/${encodeURIComponent(symbol)}`,
        { method: 'PUT', body: JSON.stringify({}) }
      );
      await loadFeed();
    };
    reactionsBar.appendChild(btn);
  });
  card.appendChild(reactionsBar);

  // Reaction counts
  if (post.reactions?.length) {
    const countsDiv = document.createElement('div');
    countsDiv.className = 'reaction-counts mb-2 text-sm text-gray-600';
    post.reactions.forEach(r => {
      const span = document.createElement('span');
      span.textContent = `${r.symbol} ${r.count}`;
      span.className = 'mr-4';
      countsDiv.appendChild(span);
    });
    card.appendChild(countsDiv);
  }

  // Comments
  const commentsDiv = document.createElement('div');
  commentsDiv.className = 'post-comments mb-4';
  const ul = document.createElement('ul');
  ul.className = 'comment-list space-y-1 mb-2 text-sm';
  (post.comments || []).forEach(c => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${c.owner}</strong>: ${c.body}`;
    ul.appendChild(li);
  });
  commentsDiv.appendChild(ul);

  // New comment form
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Add a comment...';
  input.className = 'comment-input w-full p-2 border border-gray-300 rounded mb-2';
  commentsDiv.appendChild(input);

  const commentBtn = document.createElement('button');
  commentBtn.textContent = 'Comment';
  commentBtn.className = 'bg-[#A8E0FF] hover:bg-[#F9D774] text-[#5A3E28] py-1 px-3 rounded text-sm';
  commentBtn.onclick = async () => {
    const body = input.value.trim();
    if (!body) return;
    await fetchSocial(`/social/posts/${post.id}/comment`, {
      method: 'POST',
      body: JSON.stringify({ body })
    });
    await loadFeed();
  };
  commentsDiv.appendChild(commentBtn);

  card.appendChild(commentsDiv);

  feedContainer.appendChild(card);
}

// ————————————————
// RENDER POSTS
// ————————————————
function renderPosts(posts) {
  console.log('renderPosts:', posts.length);
  feedContainer.innerHTML = '';
  if (!posts.length) {
    feedContainer.textContent = 'No posts yet.';
    return;
  }
  posts.forEach(renderPost);
}

// ————————————————
// FILTERING
// ————————————————
function applyFilters() {
  console.log('applyFilters:', currentFilter, filterSearch.value);
  const kw  = filterSearch.value.trim().toLowerCase();
  const now = Date.now();
  let items = allPosts.slice();

  if (currentFilter === 'mine') {
    items = items.filter(p => p.author.id === myUserId);
    console.log(' filtered mine →', items.length);
  }
  if (currentFilter === '1day' || currentFilter === '7days') {
    const span = currentFilter === '1day' ? 86400000 : 604800000;
    const cutoff = now - span;
    items = items.filter(p => new Date(p.createdAt).getTime() >= cutoff);
    console.log(` filtered ${currentFilter} →`, items.length);
  }
  if (kw) {
    items = items.filter(p =>
      p.title.toLowerCase().includes(kw) ||
      p.body.toLowerCase().includes(kw)
    );
    console.log(' filtered keyword →', items.length);
  }

  renderPosts(items);
}

// ————————————————
// DATA LOADING
// ————————————————
async function loadFollowing() {
  console.log('loadFollowing');
  try {
    const profile = await fetchSocial(`/social/profiles/${me}?_following=true`);
    const list = profile.following || [];
    followingSet = new Set(list.map(getId));
    console.log(' followingSet:', followingSet);
  } catch (err) {
    console.error('loadFollowing error:', err);
  }
}

async function loadCurrentUser() {
  console.log('loadCurrentUser');
  try {
    const p = await fetchSocial(`/social/profiles/${me}`);
    myUserId = getId(p);
    console.log(' myUserId =', myUserId);
    if (p.avatar?.url) {
      currentUserAvatar.src = p.avatar.url;
      currentUserAvatar.alt = `${p.name} avatar`;
    }
    currentUserNameElem.textContent = p.name;
    return p;
  } catch (err) {
    console.error('loadCurrentUser error:', err);
  }
}

async function loadFeed() {
  console.log('loadFeed');
  try {
    const [follows, mineRaw] = await Promise.all([
      fetchSocial('/social/posts/following?_author=true&_comments=true&_reactions=true'),
      fetchSocial(`/social/profiles/${me}/posts?_author=true&_comments=true&_reactions=true`)
    ]);

    await loadCurrentUser();

    // normalize author.id for all posts
    const followsNorm = follows.map(post => ({
      ...post,
      author: {
        ...post.author,
        id: getId(post.author)
      }
    }));
    const mineNorm = mineRaw.map(post => ({
      ...post,
      author: {
        id: myUserId,
        name: currentUserNameElem.textContent,
        avatar: { url: currentUserAvatar.src }
      }
    }));

    allPosts = [...followsNorm, ...mineNorm]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    console.log(' allPosts:', allPosts.length);

    applyFilters();
  } catch (err) {
    console.error('loadFeed error:', err);
    feedContainer.textContent = 'Error loading feed: ' + err.message;
  }
}

// ————————————————
// POST CREATION & DELETION
// ————————————————
postForm.onsubmit = async e => {
  e.preventDefault();
  const title = document.getElementById('postTitle').value.trim();
  const body  = document.getElementById('postBody').value.trim();
  const url   = document.getElementById('postImageUrl').value.trim();

  await fetchSocial('/social/posts', {
    method: 'POST',
    body: JSON.stringify({
      title,
      body,
      media: url ? { url, alt: 'User image' } : undefined
    })
  });
  document.getElementById('postTitle').value = '';
  document.getElementById('postBody').value  = '';
  document.getElementById('postImageUrl').value = '';
  await loadFeed();
};

async function deletePost(card, id) {
  if (!confirm('Delete this post?')) return;
  await fetchSocial(`/social/posts/${id}`, { method: 'DELETE', body: JSON.stringify({}) });
  card.remove();
}

function startEdit(card, post) {
  console.log('startEdit', post.id);
  // existing edit logic...
}

// ————————————————
// SEARCH & FOLLOW/UNFOLLOW
// ————————————————
searchForm.onsubmit = async e => {
  e.preventDefault();
  const q = searchInput.value.trim();
  searchResults.textContent = 'Searching…';
  try {
    const results = await searchProfiles(q);
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
      if (user.avatar?.url) {
        info.innerHTML = `<img src="${user.avatar.url}" alt="${user.avatar.alt}" class="w-8 h-8 rounded-full"/>`;
      } else {
        info.innerHTML = `<div class="w-8 h-8 bg-gray-200 rounded-full"></div>`;
      }
      const nameSpan = document.createElement('span');
      nameSpan.className = 'font-medium';
      nameSpan.textContent = user.name;
      info.appendChild(nameSpan);

      const btn = document.createElement('button');
      const updateFollowBtn = () => {
        const isF = followingSet.has(getId(user));
        btn.textContent = isF ? 'Unfollow' : 'Follow';
        btn.className = isF ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700';
      };
      updateFollowBtn();

      btn.onclick = async () => {
        const uid = getId(user);
        if (followingSet.has(uid)) {
          await unfollowUser(uid);
          followingSet.delete(uid);
        } else {
          await followUser(uid);
          followingSet.add(uid);
        }
        updateFollowBtn();
        await loadFeed();
      };

      row.append(info, btn);
      searchResults.appendChild(row);
    });
  } catch (err) {
    console.error('search error:', err);
    searchResults.textContent = 'Search failed: ' + err.message;
  }
};

// ————————————————
// INITIALIZATION
// ————————————————
document.addEventListener('DOMContentLoaded', () => {
  // highlight default
  filterButtons.querySelector('[data-filter="all"]').classList.add('ring-2','ring-[#5A3E28]');

  filterButtons.addEventListener('click', e => {
    if (!e.target.matches('.filter-btn')) return;
    currentFilter = e.target.dataset.filter;
    filterButtons.querySelectorAll('.filter-btn')
      .forEach(b => b.classList.remove('ring-2','ring-[#5A3E28]'));
    e.target.classList.add('ring-2','ring-[#5A3E28]');
    applyFilters();
  });

  filterSearch.addEventListener('input', applyFilters);

  (async () => {
    await loadFollowing();
    await loadFeed();
  })();
});
