// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--primary)",
          light: "var(--primary-light)",
          dark: "#1f8a9a", // Versão mais escura para hover
        },
        neutral: {
          light: "var(--neutral-light)",
          medium: "var(--neutral-medium)",
          dark: "var(--neutral-dark)",
        },
      },
      typography: {
        DEFAULT: {
          css: {
            // Configurações para preservar espaços em branco em elementos específicos
            "p, blockquote, pre, h1, h2, h3, h4, h5, h6": {
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            },
            br: {
              display: "block",
              content: '""',
              marginTop: "0.5em",
            },
            img: {
              maxWidth: "100%",
              height: "auto",
              borderRadius: "0.25rem",
            },
            a: {
              color: "var(--primary)",
              "&:hover": {
                color: "#1f8a9a",
              },
            },
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
