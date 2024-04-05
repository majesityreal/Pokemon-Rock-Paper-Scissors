/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./client/**/*.{html,js}"],
  theme: {
    extend: {},
  },
  plugins: [],
}

// to compile Tailwind: npx tailwindcss -i ./client/style.css -o ./client/stylePlusTailwind.css --watch