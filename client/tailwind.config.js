/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        transit: {
          darkest: '#0A1128',
          dark: '#001F54',
          navy: '#034078',
          teal: '#1282A2',
          cyan: '#00ADB5',
          light: '#E2F1AF',
          surface: '#0F172A',
          card: '#1E293B',
          border: '#334155',
          accent: '#06B6D4'
        }
      }
    },
  },
  plugins: [],
}
