// src/js/profile.js
import { fetchSocial } from './api.js';

const infoSec  = document.getElementById('profileInfo');
const postsSec = document.getElementById('profilePosts');
const me       = localStorage.getItem('username') || 'me';

let profileData;

// Helper to grab whichever "id" field exists
function getId(obj) {
  if (obj.id) return obj.id;
  if (obj._id) return obj._id;
  if (obj.attributes?.id) return obj.attributes.id;
  return null;
}

async function loadProfile() {
  try {
    profileData = await fetchSocial(
      `/social/profiles/${me}?_followers=true&_following=true`
    );
    renderProfile(profileData);
    addEditProfileBtn();

    // fetch posts with comments, reactions & tags
    const posts = await fetchSocial(
      `/social/profiles/${me}/posts?_author=true&_comments=true&_reactions=true`
    );
    renderPosts(posts);
  } catch (err) {
    infoSec.textContent = 'Error loading profile: ' + err.message;
  }
}

function addEditProfileBtn() {
  const existing = document.getElementById('editProfileBtn');
  if (existing) existing.remove();

  const btn = document.createElement('button');
  btn.id = 'editProfileBtn';
  btn.textContent = 'Edit Profile';
  btn.className = 'bg-[#A8E0FF] hover:bg-[#F9D774] text-[#5A3E28] py-2 px-4 rounded-lg font-semibold mt-4';
  btn.addEventListener('click', showEditForm);
  infoSec.appendChild(btn);
}

function showEditForm() {
  const p = profileData;
  infoSec.innerHTML = '';
  const form = document.createElement('form');
  form.className = 'bg-white p-6 rounded-lg shadow-md space-y-4';

  // Banner URL
  const bannerInput = document.createElement('input');
  bannerInput.type = 'url';
  bannerInput.value = p.banner?.url || '';
  bannerInput.placeholder = 'Banner URL (optional)';
  bannerInput.className = 'w-full p-2 border border-[#5A3E28] rounded focus:ring-1 focus:ring-[#F9A8B8]';

  // Avatar URL
  const avatarInput = document.createElement('input');
  avatarInput.type = 'url';
  avatarInput.value = p.avatar?.url || '';
  avatarInput.placeholder = 'Avatar URL (optional)';
  avatarInput.className = 'w-full p-2 border border-[#5A3E28] rounded focus:ring-1 focus:ring-[#F9A8B8]';

  // Bio
  const bioTextarea = document.createElement('textarea');
  bioTextarea.rows = 4;
  bioTextarea.value = p.bio || '';
  bioTextarea.placeholder = 'Bio';
  bioTextarea.className = 'w-full p-2 border border-[#5A3E28] rounded focus:ring-1 focus:ring-[#F9D774]';

  // Buttons
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
  cancelBtn.addEventListener('click', e => {
    e.preventDefault();
    loadProfile();
  });
  btnContainer.append(saveBtn, cancelBtn);

  form.append(bannerInput, avatarInput, bioTextarea, btnContainer);
  infoSec.appendChild(form);

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const updated = {
      bio: bioTextarea.value.trim() || undefined,
      avatar: avatarInput.value.trim()
        ? { url: avatarInput.value.trim(), alt: `${p.name} avatar` }
        : undefined,
      banner: bannerInput.value.trim()
        ? { url: bannerInput.value.trim(), alt: `${p.name} banner` }
        : undefined
    };
    await fetchSocial(`/social/profiles/${me}`, {
      method: 'PUT',
      body: JSON.stringify(updated)
    });
    await loadProfile();
  });
}

function renderProfile(p) {
  const followerNames  = (p.followers || []).map(u => u.name).join(', ') || 'None';
  const followingNames = (p.following || []).map(u => u.name).join(', ') || 'None';

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
    const card = document.createElement('div');
    card.className = 'bg-white p-4 rounded-lg shadow-md mb-6';
    card.dataset.postId = getId(post);

    // Media
    if (post.media?.url) {
      const img = document.createElement('img');
      img.src = post.media.url;
      img.alt = post.media.alt || '';
      img.className = 'w-full rounded mb-2';
      card.appendChild(img);
    }

    // Body
    const bodyP = document.createElement('p');
    bodyP.className = 'text-gray-700 mb-2';
    bodyP.textContent = post.body;
    card.appendChild(bodyP);

    // Tags (badges)
    if (post.tags?.length) {
      const tagsDiv = document.createElement('div');
      tagsDiv.className = 'mb-2 flex flex-wrap gap-2';
      post.tags.forEach(tag => {
        const span = document.createElement('span');
        span.textContent = `#${tag}`;
        span.className = 'text-sm bg-gray-200 px-2 py-1 rounded-full';
        tagsDiv.appendChild(span);
      });
      card.appendChild(tagsDiv);
    }

    // Edit/Delete
    const ctrlDiv = document.createElement('div');
    ctrlDiv.className = 'flex gap-4 text-sm mb-2';
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.className = 'text-[#5A3E28] hover:text-[#F9D774]';
    editBtn.onclick = () => startEditPost(card, post);
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.className = 'text-[#5A3E28] hover:text-[#F9D774]';
    deleteBtn.onclick = () => deletePost(card, getId(post));
    ctrlDiv.append(editBtn, deleteBtn);
    card.appendChild(ctrlDiv);

    // Reaction counts
    if (post.reactions?.length) {
      const rc = document.createElement('div');
      rc.className = 'reaction-counts mb-2 text-sm text-gray-600';
      post.reactions.forEach(r => {
        const span = document.createElement('span');
        span.textContent = `${r.symbol} ${r.count}`;
        span.className = 'mr-4';
        rc.appendChild(span);
      });
      card.appendChild(rc);
    }

    // Comments
    if (post.comments?.length) {
      const cm = document.createElement('ul');
      cm.className = 'comment-list space-y-1 text-sm';
      post.comments.forEach(c => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${c.owner}</strong>: ${c.body}`;
        cm.appendChild(li);
      });
      card.appendChild(cm);
    }

    postsSec.appendChild(card);
  });
}

// DELETE a post
async function deletePost(card, postId) {
  if (!confirm('Delete this post?')) return;
  await fetchSocial(`/social/posts/${postId}`, {
    method: 'DELETE',
    body: JSON.stringify({})
  });
  card.remove();
}

// INLINE EDIT a post (body, media, alt, tags)
function startEditPost(card, post) {
  card.innerHTML = '';
  const form = document.createElement('form');
  form.className = 'space-y-4';

  // Body textarea
  const bodyInput = document.createElement('textarea');
  bodyInput.rows = 4;
  bodyInput.value = post.body;
  bodyInput.className = 'w-full p-2 border border-[#5A3E28] rounded focus:ring-1 focus:ring-[#F9D774]';

  // Image URL
  const urlInput = document.createElement('input');
  urlInput.type = 'url';
  urlInput.value = post.media?.url || '';
  urlInput.placeholder = 'Image URL (optional)';
  urlInput.className = 'w-full p-2 border border-[#5A3E28] rounded focus:ring-1 focus:ring-[#F9A8B8]';

  // Image Alt
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
  cancelBtn.onclick = () => loadProfile();

  btnContainer.append(saveBtn, cancelBtn);
  form.append(bodyInput, urlInput, altInput, tagsInput, btnContainer);
  card.appendChild(form);

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const updatedBody = bodyInput.value.trim();
    const urlVal      = urlInput.value.trim();
    const altVal      = altInput.value.trim();
    const tagsStr     = tagsInput.value.trim();
    const tagsArray   = tagsStr
      ? tagsStr.split(',').map(t => t.trim()).filter(Boolean)
      : [];
    const media = urlVal
      ? { url: urlVal, ...(altVal && { alt: altVal }) }
      : undefined;

    const payload = { body: updatedBody };
    if (media) payload.media = media;
    // always include tags array (empty array clears tags)
    payload.tags = tagsArray;

    await fetchSocial(`/social/posts/${getId(post)}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    await loadProfile();
  });
}

if (infoSec && postsSec) loadProfile();
