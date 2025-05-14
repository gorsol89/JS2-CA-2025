// src/js/feed.js
import {
  fetchSocial,
  searchProfiles,
  followUser,
  unfollowUser
} from './api.js';

console.log('❯ feed.js loaded');

let allPosts       = [];
let myUserId;
let followingSet   = new Set();
const me           = localStorage.getItem('username') || 'me';

// server‐side params
let currentSortField = 'created';
let currentSortOrder = 'desc';
let currentTag       = '';

// DOM refs
const feedContainer       = document.getElementById('feedContainer');
const currentUserAvatar   = document.getElementById('currentUserAvatar');
const currentUserNameElem = document.getElementById('currentUserName');
const postForm            = document.getElementById('postForm');
const searchForm          = document.getElementById('searchForm');
const searchInput         = document.getElementById('searchInput');
const searchResults       = document.getElementById('searchResults');
const filterSearch        = document.getElementById('filterSearch');
const sortSelect          = document.getElementById('sortSelect');
const tagInput            = document.getElementById('tagInput');
const tagBtn              = document.getElementById('tagBtn');

console.log('DOM refs:', {
  feedContainer,
  currentUserAvatar,
  currentUserNameElem,
  postForm,
  searchForm,
  searchInput,
  searchResults,
  filterSearch,
  sortSelect,
  tagInput,
  tagBtn
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
  ul.className = 'comment-list space-y-2 mb-2 text-sm';
  (post.comments || []).forEach(c => {
    const li = document.createElement('li');
    li.className = 'flex items-center justify-between';
    const contentSpan = document.createElement('span');
    contentSpan.innerHTML = `<strong>${c.owner}</strong>: ${c.body}`;
    li.appendChild(contentSpan);

    // Edit/Delete for own comments
    if (c.owner === me) {
      const ctrlDiv = document.createElement('div');
      const editCBtn = document.createElement('button');
      editCBtn.textContent = '✏️';
      editCBtn.className = 'ml-2';
      editCBtn.onclick = () => startCommentEdit(post, c, contentSpan, li);
      const delCBtn = document.createElement('button');
      delCBtn.textContent = '🗑';
      delCBtn.className = 'ml-1';
      delCBtn.onclick = () => deleteComment(post.id, getId(c));
      ctrlDiv.append(editCBtn, delCBtn);
      li.appendChild(ctrlDiv);
    }

    ul.appendChild(li);
  });

  // New comment form
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Add a comment...';
  input.className = 'comment-input w-full p-2 border border-gray-300 rounded mb-2';
  commentsDiv.appendChild(ul);
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

// RENDER POSTS
function renderPosts(posts) {
  feedContainer.innerHTML = '';
  if (!posts.length) {
    feedContainer.textContent = 'No posts yet.';
    return;
  }
  posts.forEach(renderPost);
}

// FILTERING (client-side keyword only)
function applyFilters() {
  const kw = filterSearch.value.trim().toLowerCase();
  let items = allPosts.slice();
  if (kw) {
    items = items.filter(p =>
      p.title.toLowerCase().includes(kw) ||
      p.body.toLowerCase().includes(kw)
    );
  }
  renderPosts(items);
}

// DATA LOADING
async function loadFollowing() {
  try {
    const profile = await fetchSocial(`/social/profiles/${me}?_following=true`);
    followingSet = new Set((profile.following || []).map(getId));
  } catch (err) {
    console.error('loadFollowing error:', err);
  }
}

async function loadCurrentUser() {
  try {
    const p = await fetchSocial(`/social/profiles/${me}`);
    myUserId = getId(p);
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
  try {
    const tagParam = currentTag ? `&_tag=${encodeURIComponent(currentTag)}` : '';
    const [follows, mineRaw] = await Promise.all([
      fetchSocial(
        `/social/posts/following?_author=true&_comments=true&_reactions=true` +
        `&sort=${currentSortField}&sortOrder=${currentSortOrder}` +
        `${tagParam}`
      ),
      fetchSocial(
        `/social/profiles/${me}/posts?_author=true&_comments=true&_reactions=true` +
        `&sort=${currentSortField}&sortOrder=${currentSortOrder}` +
        `${tagParam}`
      )
    ]);

    await loadCurrentUser();
    await loadFollowing();

    const followsNorm = follows.map(post => ({
      ...post,
      author: { ...post.author, id: getId(post.author) }
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

    applyFilters();
  } catch (err) {
    console.error('loadFeed error:', err);
    feedContainer.textContent = 'Error loading feed: ' + err.message;
  }
}

// POST CREATION & DELETION
postForm.onsubmit = async e => {
  e.preventDefault();
  const title      = document.getElementById('postTitle').value.trim();
  const body       = document.getElementById('postBody').value.trim();
  const url        = document.getElementById('postImageUrl').value.trim();
  const alt        = document.getElementById('postImageAlt').value.trim();
  const tagsStr    = document.getElementById('postTags').value.trim();
  const tags       = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];
  const media      = url ? { url, ...(alt && { alt }) } : undefined;

  const payload = { title, body };
  if (media)  payload.media = media;
  if (tags.length) payload.tags = tags;

  await fetchSocial('/social/posts', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  postForm.reset();
  await loadFeed();
};

async function deletePost(card, id) {
  if (!confirm('Delete this post?')) return;
  await fetchSocial(`/social/posts/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({})
  });
  card.remove();
}

// INLINE POST EDIT
function startEdit(card, post) {
  card.innerHTML = '';
  const form = document.createElement('form');
  form.className = 'space-y-4';

  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.value = post.title;
  titleInput.className = 'w-full p-2 border border-[#5A3E28] rounded focus:ring-1 focus:ring-[#F9A8B8]';

  const bodyTextarea = document.createElement('textarea');
  bodyTextarea.rows = 4;
  bodyTextarea.value = post.body;
  bodyTextarea.className = 'w-full p-2 border border-[#5A3E28] rounded focus:ring-1 focus:ring-[#F9D774]';

  const imageInput = document.createElement('input');
  imageInput.type = 'url';
  imageInput.value = post.media?.url || '';
  imageInput.placeholder = 'Image URL (optional)';
  imageInput.className = 'w-full p-2 border border-[#5A3E28] rounded focus:ring-1 focus:ring-[#F9A8B8]';

  // Image Alt Text
  const altInput = document.createElement('input');
  altInput.type = 'text';
  altInput.value = post.media?.alt || '';
  altInput.placeholder = 'Image Alt Text (optional)';
  altInput.className = 'w-full p-2 border border-[#5A3E28] rounded focus:ring-1 focus:ring-[#F9A8B8]';

  // Tags
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
  cancelBtn.onclick = () => loadFeed();

  btnContainer.append(saveBtn, cancelBtn);
  form.append(titleInput, bodyTextarea, imageInput, altInput, tagsInput, btnContainer);
  card.appendChild(form);

  form.onsubmit = async e => {
    e.preventDefault();
    const updatedTitle  = titleInput.value.trim();
    const updatedBody   = bodyTextarea.value.trim();
    const urlVal        = imageInput.value.trim();
    const altVal        = altInput.value.trim();
    const tagsValStr    = tagsInput.value.trim();
    const tagsArray     = tagsValStr ? tagsValStr.split(',').map(t => t.trim()).filter(Boolean) : [];
    const mediaPayload  = urlVal ? { url: urlVal, ...(altVal && { alt: altVal }) } : undefined;

    const payload = {
      title: updatedTitle,
      body:  updatedBody
    };
    if (mediaPayload) payload.media = mediaPayload;
    if (tagsArray.length) payload.tags = tagsArray;

    await fetchSocial(`/social/posts/${post.id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    await loadFeed();
  };
}

// INLINE COMMENT EDIT / DELETE
async function deleteComment(postId, commentId) {
  if (!confirm('Delete this comment?')) return;
  await fetchSocial(
    `/social/posts/${postId}/comment/${commentId}`,
    { method: 'DELETE', body: JSON.stringify({}) }
  );
  await loadFeed();
}

function startCommentEdit(post, comment, contentSpan, li) {
  li.innerHTML = '';
  const input = document.createElement('input');
  input.type = 'text';
  input.value = comment.body;
  input.className = 'w-full p-2 border border-gray-300 rounded mb-2';

  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'Save';
  saveBtn.className = 'bg-[#A8E0FF] hover:bg-[#F9D774] text-[#5A3E28] py-1 px-3 rounded text-sm';

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.className = 'bg-[#F9A8B8] hover:bg-[#F9D774] text-[#5A3E28] py-1 px-3 rounded text-sm';

  li.append(input, saveBtn, cancelBtn);

  saveBtn.onclick = async () => {
    await fetchSocial(
      `/social/posts/${post.id}/comment/${getId(comment)}`,
      { method: 'PUT', body: JSON.stringify({ body: input.value.trim() }) }
    );
    await loadFeed();
  };
  cancelBtn.onclick = () => loadFeed();
}

// SEARCH & FOLLOW/UNFOLLOW
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
        btn.className = isF
          ? 'text-red-500 hover:text-red-700'
          : 'text-green-500 hover:text-green-700';
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

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
  filterSearch.addEventListener('input', applyFilters);

  sortSelect.addEventListener('change', () => {
    const [f, o] = sortSelect.value.split(':');
    currentSortField = f;
    currentSortOrder = o;
    loadFeed();
  });

  tagBtn.addEventListener('click', () => {
    currentTag = tagInput.value.trim();
    loadFeed();
  });

  (async () => {
    await loadFollowing();
    await loadFeed();
  })();
});
