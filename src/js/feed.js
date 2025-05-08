import {
  fetchSocial,
  searchProfiles,
  followUser,
  unfollowUser
} from './api.js';

const feedContainer       = document.getElementById('feedContainer');
const postForm            = document.getElementById('postForm');
const currentUserAvatar   = document.getElementById('currentUserAvatar');
const currentUserNameElem = document.getElementById('currentUserName');
const searchForm          = document.getElementById('searchForm');
const searchInput         = document.getElementById('searchInput');
const searchResults       = document.getElementById('searchResults');

const me         = localStorage.getItem('username') || 'me';
let myUserId;
let followingSet = new Set();

// Load who you follow
async function loadFollowing() {
  try {
    const profile = await fetchSocial(`/social/profiles/${me}?_following=true`);
    followingSet = new Set((profile.following || []).map(u => u.id));
  } catch (err) {
    console.error('Error loading following list:', err);
  }
}

// Load current user info
async function loadCurrentUser() {
  try {
    const p = await fetchSocial(`/social/profiles/${me}`);
    myUserId = p.id;
    if (p.avatar?.url) {
      currentUserAvatar.src = p.avatar.url;
      currentUserAvatar.alt = `${p.name} avatar`;
    }
    currentUserNameElem.textContent = p.name;
    return p;
  } catch (err) {
    console.error('Error loading current user:', err);
    return null;
  }
}

// Fetch feed (following + own) including comments & reactions
async function loadFeed() {
  feedContainer.innerHTML = '';
  try {
    const [follows, mineRaw] = await Promise.all([
      fetchSocial('/social/posts/following?_author=true&_comments=true&_reactions=true'),
      fetchSocial(`/social/profiles/${me}/posts?_author=true&_comments=true&_reactions=true`)
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

// Render one post (with reactions & comments)
function renderPost(post) {
  const card = document.createElement('div');
  card.className = 'bg-white p-4 rounded-lg shadow-md';
  card.dataset.postId = post.id;

  // Basic post content
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

  // Edit/Delete for own posts
  if (post.author.id === myUserId) {
    const ctrls = document.createElement('div');
    ctrls.className = 'flex space-x-4 text-sm mb-2';
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.className = 'text-[#5A3E28] hover:text-[#F9D774]';
    editBtn.addEventListener('click', () => startEdit(card, post));
    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    delBtn.className = 'text-[#5A3E28] hover:text-[#F9D774]';
    delBtn.addEventListener('click', () => deletePost(card, post.id));
    ctrls.append(editBtn, delBtn);
    card.appendChild(ctrls);
  }

  // Reactions bar
  const reactionsBar = document.createElement('div');
  reactionsBar.className = 'post-reactions flex items-center space-x-2 mb-2';
  reactionsBar.innerHTML = `<label class="font-medium">React:</label>`;
  const emojis = ['🤣','🎉','🐶','❤️','👍','👏','😻','😿'];
  emojis.forEach(symbol => {
    const btn = document.createElement('button');
    btn.textContent = symbol;
    btn.className = 'emoji-btn text-xl';
    btn.addEventListener('click', async () => {
      try {
        await fetchSocial(`/social/posts/${post.id}/react/${encodeURIComponent(symbol)}`, {
          method: 'PUT',
          body: JSON.stringify({})
        });
        await loadFeed();
      } catch (err) {
        console.error('Reaction failed:', err);
      }
    });
    reactionsBar.appendChild(btn);
  });
  card.appendChild(reactionsBar);

  // Show current reaction counts
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

  // Comments section
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

  // New comment input + button
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Add a comment...';
  input.className = 'comment-input w-full p-2 border border-gray-300 rounded mb-2';
  commentsDiv.appendChild(input);

  const commentBtn = document.createElement('button');
  commentBtn.textContent = 'Comment';
  commentBtn.className = 'bg-[#A8E0FF] hover:bg-[#F9D774] text-[#5A3E28] py-1 px-3 rounded text-sm';
  commentBtn.addEventListener('click', async () => {
    const body = input.value.trim();
    if (!body) return;
    try {
      await fetchSocial(`/social/posts/${post.id}/comment`, {
        method: 'POST',
        body: JSON.stringify({ body })
      });
      await loadFeed();
    } catch (err) {
      console.error('Adding comment failed:', err);
    }
  });
  commentsDiv.appendChild(commentBtn);

  card.appendChild(commentsDiv);

  feedContainer.appendChild(card);
}

// Create post
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
    titleInput.value = '';
    bodyInput.value  = '';
    imgInput.value   = '';
    await loadFeed();
  } catch (err) {
    alert('Failed to create post: ' + err.message);
  }
});

// Delete a post
async function deletePost(card, id) {
  if (!confirm('Delete this post?')) return;
  try {
    await fetchSocial(`/social/posts/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({})
    });
    card.remove();
  } catch (err) {
    alert('Failed to delete: ' + err.message);
  }
}

// Edit (unchanged)
function startEdit(card, post) {
  /* … your existing edit logic … */
}

// Search & Follow/Unfollow
searchForm.addEventListener('submit', async e => {
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
        info.innerHTML = `<img src="${user.avatar.url}" alt="${user.avatar.alt}"
                               class="w-8 h-8 rounded-full"/>`;
      } else {
        info.innerHTML = `<div class="w-8 h-8 bg-gray-200 rounded-full"></div>`;
      }
      const nameSpan = document.createElement('span');
      nameSpan.className = 'font-medium';
      nameSpan.textContent = user.name;
      info.appendChild(nameSpan);

      const btn = document.createElement('button');
      const updateFollowBtn = () => {
        const isFollowingNow = followingSet.has(user.id);
        btn.textContent = isFollowingNow ? 'Unfollow' : 'Follow';
        btn.className = isFollowingNow
          ? 'text-red-500 hover:text-red-700'
          : 'text-green-500 hover:text-green-700';
      };
      updateFollowBtn();

      btn.addEventListener('click', async () => {
        try {
          if (followingSet.has(user.id)) {
            await unfollowUser(user.id);
            followingSet.delete(user.id);
          } else {
            await followUser(user.id);
            followingSet.add(user.id);
          }
          updateFollowBtn();
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

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadCurrentUser();
  await loadFollowing();
  await loadFeed();
});
