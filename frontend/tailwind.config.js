/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        risk: {
          low: '#10B981',
          moderate: '#F59E0B',
          high: '#F97316',
          severe: '#EF4444',
          notravel: '#7F1D1D'
        }
      }
    },
  },
  plugins: [],
}
