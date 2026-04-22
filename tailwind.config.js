/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        falcon: {
          900: '#0a0f1e',
          800: '#0d1526',
          700: '#111d35',
          600: '#162040',
          500: '#1a2a54',
          400: '#2563eb',
          300: '#3b82f6',
          200: '#93c5fd',
          100: '#dbeafe',
        },
        gold: {
          500: '#d4a017',
          400: '#eab308',
          300: '#fcd34d',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s infinite',
        'typing': 'typing 1.2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        typing: {
          '0%, 60%, 100%': { transform: 'translateY(0)' },
          '30%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
