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
        //Cores principais
        primary: {
          DEFAULT: "#2EA6B8",
          light: "#58C5D6",
        },
        // Cores neutras/cinza
        neutral: {
          light: "#A7A9AC",
          medium: "#939598",
          dark: "#808285",
        },
        //Font
        fontFamily: {
          inter: ["Inter", "sans-serif"],
        },
      },
    },
  },
  plugins: [],
};
