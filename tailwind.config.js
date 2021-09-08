const colors = require('tailwindcss/colors')

/**@type {import("tailwindcss/tailwind-config").TailwindConfig} */
const config = {
  mode: 'jit',
  purge: ['./{hooks,uikit,components,pages,styles}/**/*.{js,ts,jsx,tsx}'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    colors: {
      'block-light': colors.white,
      'block-semi-light': colors.gray[100],
      'block-semi-dark': colors.gray[400],
      'block-dark': colors.gray[600],
      'text-light': colors.gray[100],
      'text-dark': colors.coolGray[700]
    }
  },
  variants: {
    extend: {}
  },
  plugins: []
}

module.exports = config
