/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '.dark-theme'],
  content: [
    "./src/**/*.{html,ts,scss}",
  ],
  theme: {
    extend: {
      colors: {
        saffron: {
          light: '#ffa07a',
          DEFAULT: '#f46d43',
          dark: '#d05b38',
        },
        gold: {
          light: '#ffe082',
          DEFAULT: '#ffb300',
          dark: '#ff8f00',
        },
        forest: {
          light: '#4db6ac',
          DEFAULT: '#00796b',
          dark: '#004d40',
        }
      }
    },
  },
  plugins: [],
}
