/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#09090b",
        surface: "#121217",
        "surface-card": "#18181f",
        "surface-hover": "#22222b",
        border: "#27272a",
        primary: "#7c3aed",
      },
    },
  },
  plugins: [],
}

