/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        shelf: {
          50: '#fdf8f0',
          100: '#f5e6c8',
          200: '#e8c98a',
          300: '#d4a852',
          400: '#c08a2e',
          500: '#8B5E3C',
          600: '#6B3F1E',
          700: '#4A2810',
          800: '#2d1810',
          900: '#1a0e08',
        },
        ink: {
          DEFAULT: '#1a1a2e',
          light: '#16213e',
          muted: '#4a5568',
        },
        accent: {
          DEFAULT: '#e94560',
          hover: '#c73652',
        },
        gold: '#f5a623',
      },
    },
  },
  plugins: [],
}
