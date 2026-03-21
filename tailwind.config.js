/**** TailwindCSS Config ****/
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#d946ef', // fuchsia-500 (vibrante)
          foreground: '#ffffff',
        },
        muted: '#111827', // slate-900 (plano de fundo secundário)
        card: '#0f172a',  // slate-900/950 para cartões
        border: '#1f2937', // slate-800
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.1)'
      }
    },
  },
  plugins: [],
};
