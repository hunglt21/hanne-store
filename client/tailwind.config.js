/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  // Disable preflight so Tailwind's reset doesn't fight MUI's baseline.
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef7f1',
          100: '#d6ecdf',
          200: '#aed9bf',
          300: '#7fc19b',
          400: '#4fa576',
          500: '#2e8b57', // sea green — primary
          600: '#237046',
          700: '#1d5a39',
          800: '#184730',
          900: '#123526',
        },
        rose: {
          400: '#e07a94',
          500: '#d6607f',
        },
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
