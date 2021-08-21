const colors = require('tailwindcss/colors')


/**@type {import("tailwindcss/tailwind-config").TailwindConfig} */
const config = {
  mode:'jit',
  purge: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}','./uikit/**/*.{js,ts,jsx,tsx}'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    colors: {
      'fill-dark': colors.gray[600],
      'fill-light': colors.white,
      'text-light': colors.gray[100],
      'text-dark': colors.coolGray[700],
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}

module.exports = config