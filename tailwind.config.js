/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './templates/**/*.html',
    './static/js/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#e10600',
          deep: '#a30500',
          tint: '#e1060012'
        },
        ink: {
          DEFAULT: '#141110',
          90: '#141110e6',
          70: '#141110b3',
          50: '#14111080',
          30: '#1411104d',
          10: '#1411101a'
        },
        paper: {
          DEFAULT: '#ffffff',
          dark: '#141110',
          cardDark: '#1c1613'
        }
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        mono: ['Space Mono', 'ui-monospace', 'monospace']
      }
    }
  },
  plugins: []
};
