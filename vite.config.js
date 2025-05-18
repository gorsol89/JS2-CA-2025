import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [ tailwindcss() ],    // add Tailwind plugin:contentReference[oaicite:3]{index=3}
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        feed: resolve(__dirname, 'feed.html'),
        post: resolve(__dirname, 'post.html'),
        register: resolve(__dirname, 'register.html'),
        profile: resolve(__dirname, 'profile.html'),
      }
    }
  }
})
