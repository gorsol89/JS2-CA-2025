/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./pages/**/*.{html,js}",
    "./src/**/*.{html,js}"
  ],
  theme: {
    extend: {
      colors: {
        // Pastel palette from your logo
        'brand-pink':   '#F9A8B8',
        'brand-yellow': '#F9D774',
        'brand-green':  '#A2EBC0',
        'brand-blue':   '#A8E0FF',
        'brand-brown':  '#5A3E28',
      },
      // optional: set a custom background gradient
      backgroundImage: {
        'fuzzy-gradient': 'linear-gradient(135deg, #5A3E28 0%, #2B2B2B 100%)',
      }
    },
  },
  plugins: [],
};
