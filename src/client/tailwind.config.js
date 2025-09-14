/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'philippines-blue': '#0038a8',
        'philippines-red': '#ce1126',
        'authority-gold': '#ffd700',
      }
    },
  },
  plugins: [],
}