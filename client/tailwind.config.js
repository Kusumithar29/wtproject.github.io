/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4F46E5', // Deep Indigo
          light: '#6366F1',
          dark: '#4338CA',
        },
        accent: {
          admin: '#F43F5E',   // Rose
          manager: '#F59E0B', // Amber
          owner: '#3B82F6',   // Blue
          tenant: '#14B8A6',  // Teal
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
