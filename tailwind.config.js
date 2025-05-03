// filepath: /Users/pranshupandey/Developer/Personal/orm/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}", // Include files in the app directory
    "./pages/**/*.{js,ts,jsx,tsx,mdx}", // If you have a pages directory
    "./components/**/*.{js,ts,jsx,tsx,mdx}", // Include files in the components directory
    // Or if using `src` directory:
    // "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  darkMode: 'class',
}