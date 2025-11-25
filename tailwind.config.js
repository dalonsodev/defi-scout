/** @type {import('tailwindcss').Config} */
export default {
   content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
   theme: {
      extend: {
         zIndex: {
            "2": "2",
            "3": "3"
         }
      }
   },
   plugins: [require("daisyui")],
   daisyui: { themes: ["dark"] },
};