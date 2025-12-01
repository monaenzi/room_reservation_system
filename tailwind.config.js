/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        kait: {
          green: "#008b40",
          greenLight: "#32b76c",
          grayCard: "#f3f3f3",
        },
      },
      boxShadow: {
        soft: "0 12px 30px rgba(0,0,0,0.15)",
      },
      borderRadius: {
        xl2: "24px",
      },
    },
  },
  plugins: [],
};
