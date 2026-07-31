/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: '#9d4edd',
        'accent-light': 'rgba(157, 78, 221, 0.15)',
        'owasp-blue': '#4a7bfe',
        'owasp-red': '#ff2a5f',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        fira: ['Fira Code', 'monospace'],
        cascadia: ['Cascadia Code', 'monospace'],
      },
      keyframes: {
        float: {
          '0%': { transform: 'translate(0, 0) scale(1)' },
          '100%': { transform: 'translate(40px, 60px) scale(1.1)' },
        },
        pingRing: {
          '75%, 100%': { transform: 'translate(-50%, -50%) scale(1.3)', opacity: '0' },
        },
        blink: {
          '50%': { opacity: '0' },
        }
      },
      animation: {
        'float-slow': 'float 12s infinite alternate ease-in-out',
        'float-reverse': 'float 15s infinite alternate-reverse ease-in-out',
        'ping-ring': 'pingRing 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
        'cursor-blink': 'blink 1s infinite',
      }
    },
  },
  plugins: [],
};