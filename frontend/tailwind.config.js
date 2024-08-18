/** @type {import('tailwindcss').Config} */
export default {
  important: "#root",
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/routes/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./index.html"
  ],
  theme: {
    fontFamily: {
      sans: ["Roboto", "Helvetica Neue", "sans-serif"],
    },
    extend: {
      colors: {
        dark: '#28282B',
      },
    },
  },
  // plugins: [require("tailwindcss-radix")({
  //   variantPrefix: "rdx"
  // })],
}

