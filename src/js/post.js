// src/js/post.js
import { API_BASE, fetchJSON } from './api.js';

const postForm = document.getElementById('postForm');

if (postForm) {
  postForm.addEventListener('submit', async e => {
    e.preventDefault();
    const title = e.target.postTitle.value;
    const body  = e.target.postBody.value;
    const media = e.target.postImageUrl.value;

    try {
      // Create the post
      await fetchJSON(
        `${API_BASE}/social/posts`,
        {
          method: 'POST',
          body: JSON.stringify({ title, body, media })
        }
      );
      // On success, go back to feed
      window.location.href = 'feed.html';
    } catch (err) {
      alert('Failed to create post: ' + err.message);
    }
  });
}
