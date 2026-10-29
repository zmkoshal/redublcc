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
        ubl: {
          blue: '#004B87',
          dark: '#002E54',
          light: '#E6EFF7',
        },
        taniisha: {
          primary: '#1E40AF',
          accent: '#0D9488',
          gold: '#D97706',
          danger: '#DC2626',
          success: '#16A34A',
          darkBg: '#0F172A',
          cardDark: '#1E293B',
          borderDark: '#334155'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
}
