// src/js/post.js
import { fetchSocial } from './api.js';

const postForm = document.getElementById('postForm');
if (postForm) {
  postForm.addEventListener('submit', async e => {
    e.preventDefault();
    const { postTitle, postBody, postImageUrl } = e.target.elements;
    try {
      await fetchSocial('/social/posts', {
        method: 'POST',
        body: JSON.stringify({
          title: postTitle.value.trim(),
          body:  postBody.value.trim(),
          media: { url: postImageUrl.value.trim(), alt: 'User post image' }
        })
      });
      window.location.href = 'feed.html';
    } catch (err) {
      alert('Failed to create post: ' + err.message);
    }
  });
}
