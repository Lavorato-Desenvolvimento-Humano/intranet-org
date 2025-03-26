/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cores principais
        primary: {
          DEFAULT: "#2EA6B8",
          light: "#58C5D6",
          dark: "#2686A0", // Adicionei uma versão mais escura para hover
        },
        // Cores neutras/cinza
        neutral: {
          light: "#A7A9AC",
          medium: "#939598",
          dark: "#808285",
        },
      },
      fontFamily: {
        inter: ["Inter", "sans-serif"],
      },
      // Configuração de tipografia para o editor rich text
      typography: {
        DEFAULT: {
          css: {
            color: "#333",
            maxWidth: "none",
            a: {
              color: "#2EA6B8",
              "&:hover": {
                color: "#2686A0",
              },
              textDecoration: "underline",
            },
            "h1, h2, h3, h4, h5, h6": {
              color: "#333",
              fontWeight: "600",
              marginTop: "1.25em",
              marginBottom: "0.75em",
            },
            h1: {
              fontSize: "1.875rem",
            },
            h2: {
              fontSize: "1.5rem",
            },
            strong: {
              fontWeight: "600",
              color: "#333",
            },
            ol: {
              listStyleType: "decimal",
              paddingLeft: "1.5em",
            },
            ul: {
              listStyleType: "disc",
              paddingLeft: "1.5em",
            },
            li: {
              marginTop: "0.25em",
              marginBottom: "0.25em",
            },
            img: {
              marginTop: "1em",
              marginBottom: "1em",
              borderRadius: "0.375rem",
            },
            p: {
              marginTop: "1em",
              marginBottom: "1em",
            },
            table: {
              width: "100%",
              marginTop: "1.5em",
              marginBottom: "1.5em",
              borderCollapse: "collapse",
            },
            "thead, tbody": {
              borderBottom: "1px solid #e5e7eb",
            },
            "th, td": {
              padding: "0.75em",
              borderBottom: "1px solid #e5e7eb",
              borderRight: "1px solid #e5e7eb",
            },
            th: {
              backgroundColor: "#f9fafb",
              fontWeight: "600",
              textAlign: "left",
            },
          },
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"), // Plugin para estilizar conteúdo HTML rico
  ],
};
