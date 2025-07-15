/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pastel: {
          pink: '#FFE5E5',
          blue: '#E5F3FF',
          green: '#E5FFE5',
          yellow: '#FFF5E5',
          purple: '#F0E5FF',
          orange: '#FFE5CC',
          mint: '#E5FFF5',
          lavender: '#F5E5FF',
          peach: '#FFE5D9',
          cyan: '#E5FFFF'
        }
      }
    },
  },
  plugins: [],
}