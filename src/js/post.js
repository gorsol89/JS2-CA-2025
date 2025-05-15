// src/js/post.js

const token  = localStorage.getItem('accessToken');
const apiKey = localStorage.getItem('apiKey');
const container = document.getElementById('post-detail');

container.innerHTML = '<p>Loading…</p>';

const postId = new URLSearchParams(window.location.search).get('id');
if (!postId) {
  container.innerHTML = '<p class="text-red-600">Error: No post ID provided.</p>';
  throw new Error('Missing post ID');
}

fetch(`https://api.noroff.dev/api/v1/social/posts/${postId}?_author=true&_comments=true&_reactions=true`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Noroff-API-Key': apiKey
  }
})
  .then(res => {
    if (res.status === 401) {
      window.location = 'index.html';
      throw new Error('Unauthorized');
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  })
  .then(renderPost)
  .catch(err => {
    container.innerHTML = `<p class="text-red-600">Error loading post: ${err.message}</p>`;
    console.error(err);
  });

function renderPost(post) {
  const { title, body, media, author, reactions, comments, created } = post;
  const date = new Date(created).toLocaleString();
  const likes = Array.isArray(reactions) ? reactions.filter(r => r.like).length : 0;

  const commentsHTML = Array.isArray(comments) && comments.length
    ? comments.map(c => {
        const d = new Date(c.created).toLocaleString();
        return `
          <div class="border p-4 rounded mb-4">
            <p class="text-sm text-gray-600"><strong>${c.owner.name}</strong> on ${d}</p>
            <p>${c.body}</p>
          </div>`;
      }).join('')
    : '<p>No comments yet.</p>';

  container.innerHTML = `
    <article class="prose mx-auto">
      <h1 class="text-3xl font-bold">${title}</h1>
      <p class="text-sm text-gray-600">by ${author.name} on ${date}</p>
      ${media ? `<img src="${media}" alt="Post image" class="w-full my-4 rounded" />` : ''}
      <div class="mt-4">${body}</div>
      <p class="mt-6"><strong>Likes:</strong> ${likes}</p>
      <hr class="my-6" />
      <section>
        <h2 class="text-2xl font-semibold mb-4">Comments (${Array.isArray(comments)?comments.length:0})</h2>
        ${commentsHTML}
      </section>
    </article>
  `;
}
