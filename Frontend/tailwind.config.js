/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1e3a5f',
          light: '#2c4870',
          dark: '#152c4c',
        },
        gold: {
          DEFAULT: '#e6c89c',
          light: '#f0d9b5',
          dark: '#d2b78e',
        },
        sage: {
          DEFAULT: '#7c9082',
          light: '#99a99f',
          dark: '#5f7065',
        },
        offwhite: {
          DEFAULT: '#f8f7f4',
          dark: '#ece9e1',
        },
        primary: {
          DEFAULT: '#1e3a5f',
          light: '#2c4870',
          dark: '#152c4c',
        },
        secondary: {
          DEFAULT: '#e6c89c',
          light: '#f0d9b5',
          dark: '#d2b78e',
        },
        beige: {
          DEFAULT: '#dad7cd',
          light: '#e9e5dc',
          dark: '#c2beb4',
        },
        forest: {
          DEFAULT: '#3a5a40',
          light: '#588157',
          dark: '#344e41',
        },
        dark: '#1A1A1A',
        purple: '#9776F0',
        blue: '#3A75E0',
        orange: '#FFB16C',
        lime: '#C4F060',
        pink: '#F47DD1',
      },
      fontFamily: {
        sans: ['Work Sans', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
        display: ['Playfair Display', 'serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(0, 0, 0, 0.05)',
        'elevated': '0 10px 30px rgba(0, 0, 0, 0.08)',
      },
      borderWidth: {
        'thin': '1px',
      },
      animation: {
        'bounce-slow': 'bounce 3s infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        }
      },
    },
  },
  plugins: [],
} 