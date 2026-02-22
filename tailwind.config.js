/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'chess-bg': '#0f172a',
        'chess-card': '#1e293b',
        'chess-border': '#334155',
        'pawn-gold': '#fbbf24',
        'pawn-gold-hover': '#f59e0b',
      },
    },
  },
  plugins: [],
}
