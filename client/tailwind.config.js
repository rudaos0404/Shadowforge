/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark Fantasy Palette
        background: '#0a0a0a',
        surface: '#1a1a1a',
        primary: '#8b0000', // Deep Red
        secondary: '#4a4a4a',
        accent: '#fbbf24', // Gold
      },
    },
  },
  plugins: [],
}
