/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        chentouf: {
          50: '#fbf7ee',
          100: '#f5ecd6',
          200: '#edd8ad',
          300: '#e2bf7c',
          400: '#d7a44f',
          500: '#c5872d',
          600: '#aa6b23',
          700: '#88501f',
          800: '#70411f',
          900: '#5e371d',
          950: '#351d0d',
        },
      },
    },
  },
  plugins: [],
}


