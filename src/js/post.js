// src/js/post.js
import { fetchSocial } from './api.js';

const container = document.getElementById('post-detail');
container.innerHTML = '<p>Loading…</p>';

const postId = new URLSearchParams(window.location.search).get('id');
if (!postId) {
  container.innerHTML = '<p class="text-red-600">Error: No post ID in URL.</p>';
  throw new Error('Missing post ID');
}

let me = localStorage.getItem('username');
//console.log('Logged in user:', me);

// Initial fetch and render
fetchAndRenderPost();

function fetchAndRenderPost() {
  fetchSocial(`/social/posts/${postId}?_author=true&_comments=true&_reactions=true`)
    .then(res => {
      const post = res.data || res;
      renderPost(post);
    })
    .catch(err => {
      container.innerHTML = `<p class="text-red-600">Error loading post: ${err.message}</p>`;
      //console.log('Error loading post:', err);
    });
}

function renderPost(post) {
  const { title, body, media, tags, author, reactions, comments, created, id } = post;
  const date = new Date(created).toLocaleString();
  const likes = Array.isArray(reactions) ? reactions.filter(r => r.like).length : 0;

  const tagsHTML = Array.isArray(tags) && tags.length
    ? `<p class="mt-4">${tags.map(tag =>
        `<span class="inline-block bg-gray-200 text-sm px-2 py-1 rounded mr-2">#${tag}</span>`
      ).join('')}</p>`
    : '';

  const commentsHTML = Array.isArray(comments) && comments.length
    ? comments.map(c => {
        const d = new Date(c.created).toLocaleString();
        const ownerName = c.owner?.name || c.owner || 'User';
        return `
          <div class="border p-4 rounded mb-4">
            <p class="text-sm text-gray-600"><strong>${ownerName}</strong> on ${d}</p>
            <p>${c.body}</p>
          </div>`;
      }).join('')
    : '<p>No comments yet.</p>';

  // --- Comment form ---
  const commentForm = `
    <form id="singleCommentForm" class="flex gap-2 mt-4">
      <input
        type="text"
        name="comment"
        id="singleCommentInput"
        placeholder="Write a comment…"
        required
        class="flex-grow p-2 border border-[#5A3E28] rounded"
      />
      <button
        type="submit"
        class="bg-[#A8E0FF] hover:bg-[#F9D774] text-[#5A3E28] px-4 rounded font-semibold"
      >
        Post
      </button>
    </form>
  `;

  // --- Edit/Delete buttons for post owner ---
  const isMine = author?.name === me;
  //console.log('Is this my post?', isMine, 'author:', author?.name, 'me:', me);
  const controls = isMine
    ? `
      <div class="my-4 flex gap-2">
        <button id="editBtn" class="bg-[#A8E0FF] hover:bg-[#F9D774] text-[#5A3E28] px-4 rounded font-semibold">Edit</button>
        <button id="deleteBtn" class="bg-[#F9A8B8] hover:bg-[#F9D774] text-[#5A3E28] px-4 rounded font-semibold">Delete</button>
      </div>
    `
    : '';

  container.innerHTML = `
    <article class="prose mx-auto">
      <h1 class="text-3xl font-bold">${title}</h1>
      <p class="text-sm text-gray-600">by ${author?.name || 'User'} on ${date}</p>
      ${media ? `<img src="${media.url}" alt="${media.alt||'Post image'}" class="w-full my-4 rounded" />` : ''}
      <div class="mt-4">${body}</div>
      ${tagsHTML}
      <p class="mt-6"><strong>Likes:</strong> ${likes}</p>
      ${controls}
      <hr class="my-6"/>
      <section>
        <h2 class="text-2xl font-semibold mb-4">
          Comments (${Array.isArray(comments)?comments.length:0})
        </h2>
        ${commentsHTML}
        ${commentForm}
      </section>
    </article>
  `;

  // --- Edit/Delete handlers ---
  if (isMine) {
    const editBtn = document.getElementById('editBtn');
    const deleteBtn = document.getElementById('deleteBtn');
    if (editBtn) {
      editBtn.addEventListener('click', () => showEditForm(post));
    }
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        if (!confirm('Delete this post?')) return;
        try {
          await fetchSocial(`/social/posts/${id}`, { method: 'DELETE' });
          window.location.href = 'feed.html'; // or profile.html if coming from profile
        } catch (err) {
          alert('Failed to delete post');
        }
      });
    }
  }

  // --- Comment submit handler ---
  const form = document.getElementById('singleCommentForm');
  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const input = document.getElementById('singleCommentInput');
      const commentBody = input.value.trim();
      if (!commentBody) return;
      form.querySelector('button').disabled = true;
      try {
        await fetchSocial(`/social/posts/${postId}/comment`, {
          method: 'POST',
          body: JSON.stringify({ body: commentBody })
        });
        input.value = '';
        fetchAndRenderPost();
      } catch (err) {
        alert('Failed to add comment');
      }
      form.querySelector('button').disabled = false;
    });
  }
}

// --- Edit post form for single post page ---
function showEditForm(post) {
  //console.log('Show edit form for:', post);
  const { title, body, media, tags, id } = post;
  container.innerHTML = `
    <form id="editPostForm" class="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
      <h2 class="text-xl font-bold mb-4">Edit Post</h2>
      <input type="text" id="editTitle" value="${title}" required
        class="w-full mb-2 p-2 border border-[#5A3E28] rounded" />
      <textarea id="editBody" rows="4" required
        class="w-full mb-2 p-2 border border-[#5A3E28] rounded">${body}</textarea>
      <input type="url" id="editImage" value="${media?.url || ''}"
        placeholder="Image URL" class="w-full mb-2 p-2 border border-[#5A3E28] rounded" />
      <input type="text" id="editAlt" value="${media?.alt || ''}"
        placeholder="Image Alt Text" class="w-full mb-2 p-2 border border-[#5A3E28] rounded" />
      <input type="text" id="editTags" value="${(tags||[]).join(', ')}"
        placeholder="Tags (comma separated)" class="w-full mb-4 p-2 border border-[#5A3E28] rounded" />
      <div class="flex gap-4">
        <button type="submit"
          class="bg-[#A8E0FF] hover:bg-[#F9D774] text-[#5A3E28] px-4 rounded font-semibold">Save</button>
        <button type="button" id="cancelEdit"
          class="bg-[#F9A8B8] hover:bg-[#F9D774] text-[#5A3E28] px-4 rounded font-semibold">Cancel</button>
      </div>
    </form>
  `;
  document.getElementById('editPostForm').addEventListener('submit', async e => {
    e.preventDefault();
    const updated = {
      title: document.getElementById('editTitle').value.trim(),
      body: document.getElementById('editBody').value.trim(),
      media: document.getElementById('editImage').value.trim()
        ? { url: document.getElementById('editImage').value.trim(), alt: document.getElementById('editAlt').value.trim() }
        : undefined,
      tags: document.getElementById('editTags').value.trim()
        ? document.getElementById('editTags').value.split(',').map(t => t.trim()).filter(Boolean)
        : []
    };
    try {
      await fetchSocial(`/social/posts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updated)
      });
      fetchAndRenderPost();
    } catch (err) {
      alert('Failed to save changes');
    }
  });
  document.getElementById('cancelEdit').addEventListener('click', fetchAndRenderPost);
}
