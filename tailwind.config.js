// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./pages/**/*.{html,js}",
    "./src/**/*.{html,js}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-pink':   '#F9A8B8',
        'brand-blue':   '#A8E0FF',
        'brand-green':  '#A2EBC0',
        'brand-yellow': '#F9D774',
        'brand-brown':  '#5A3E28',
      },
    },
  },
  plugins: [],
};
