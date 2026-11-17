/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#070709',
          900: '#0B0C10',
          800: '#12141C',
          700: '#1C1F2E',
        },
        cyber: {
          cyan: '#06B6D4',
          sky: '#38BDF8',
          blue: '#3B82F6',
          indigo: '#6366F1',
          violet: '#8B5CF6',
          purple: '#A855F7',
          pink: '#EC4899',
          emerald: '#10B981',
          teal: '#14B8A6',
          amber: '#F59E0B',
        },
      },
      animation: {
        'float-slow': 'float 7s ease-in-out infinite',
        'float-delayed': 'float 8s ease-in-out 2s infinite',
        'float-reverse': 'float-reverse 6s ease-in-out 1s infinite',
        'pulse-glow': 'pulse-glow 5s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'laser-beam': 'laser 3s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-14px) rotate(1.5deg)' },
        },
        'float-reverse': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(12px) rotate(-1.5deg)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.75', transform: 'scale(1.08)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
};
