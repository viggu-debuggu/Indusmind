/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        industrial: {
          darkest: '#0B192C',  // Deep Dark Blue
          dark: '#1E3E62',     // Industrial Steel Blue
          gray: '#8B9A46',     // Light Gold-Green Accent (Optional)
          steel: '#475569',    // Steel Gray
          light: '#F8FAFC',    // Slate Light Background
          border: '#E2E8F0',   // Light border
          navy: '#0F172A',     // Slate-900 Navy
        },
        primary: {
          DEFAULT: '#1E3E62',
          light: '#3A6073',
          dark: '#0B192C',
        },
        steel: {
          DEFAULT: '#64748B',
          light: '#94A3B8',
          dark: '#475569',
        }
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'Inter', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
}
