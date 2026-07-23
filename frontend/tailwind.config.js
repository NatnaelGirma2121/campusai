/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0B0F14",
        surface: "#121821",
        surfaceRaised: "#171F2A",
        border: "#232E3D",
        copper: "#C08552",
        copperDim: "#8A6038",
        signal: "#5B8DEF",
        text: "#E8EDF2",
        muted: "#7A8699",
        danger: "#E5673F",
        success: "#4FAE8A",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
