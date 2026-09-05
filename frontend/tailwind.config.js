
/** @type {import('tailwindcss').Config} */

function withOpacity(variableName) {

  return ({ opacityValue }) => {

    if (opacityValue !== undefined) {

      return `rgb(var(${variableName}) / ${opacityValue})`;

    }

    return `rgb(var(${variableName}))`;

  };

}

module.exports = {

  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],

  theme: {

    extend: {

      colors: {

        bg: withOpacity("--color-bg"),

        surface: withOpacity("--color-surface"),

        surfaceRaised: withOpacity("--color-surfaceRaised"),

        border: withOpacity("--color-border"),

        copper: withOpacity("--color-copper"),

        copperDim: withOpacity("--color-copperDim"),

        signal: withOpacity("--color-signal"),

        text: withOpacity("--color-text"),

        muted: withOpacity("--color-muted"),

        danger: withOpacity("--color-danger"),

        success: withOpacity("--color-success"),

        ink: withOpacity("--color-ink"),

      },

      fontFamily: {

        display: ["var(--font-display)", "sans-serif"],

        body: ["var(--font-body)", "sans-serif"],

        mono: ["var(--font-mono)", "monospace"],

      },

      animation: {

        "pulse-slow": "pulse-slow 3.5s ease-in-out infinite",

      },

      keyframes: {

        "pulse-slow": {

          "0%, 100%": { opacity: "0.55" },

          "50%": { opacity: "1" },

        },

      },

    },

  },

  plugins: [],

};

