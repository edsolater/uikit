const colors = require('tailwindcss/colors')
const plugin = require('tailwindcss/plugin')

/**@type {import("tailwindcss/tailwind-config").TailwindConfig} */
const config = {
  mode: 'jit',
  content: ['./src/{hooks,uikit,components,pages,styles}/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'media', // or 'media' or 'class'

  theme: {
    colors: {
      'transparent': '#fff0',
      // 👇 card color
      'block-light': colors.white,
      'block-semi-light': colors.gray[100],
      'block-semi-dark': '#515254d6',
      'block-dark': '#444c',
      'bg-dark': '#252627',

      // 👇 colorful
      'block-color-primary': colors.yellow[500],

      'text-light': colors.zinc[100],
      'text-dark': colors.gray[700]
    }
  },
  variants: {
    extend: {}
  },
  plugins: [
    plugin(({ addUtilities }) => {
      addUtilities(
        {
          '.win10-light-spot': {
            position: 'relative',
            '&::before': {
              // '--tw-ring-color': 'rgba(255, 255, 255,80)',
              '--spot-x': 'calc(calc(var(--pointer-x, 0)* 1px) - calc(var(--left, 0) * 1px))',
              '--spot-y': 'calc(calc(var(--pointer-y, 0)* 1px) - calc(var(--top, 0) * 1px))',
              content: "''",
              position: 'absolute',
              top: '0',
              right: '0',
              bottom: '0',
              left: '0',
              borderRadius: 'inherit',
              boxShadow: 'inset 0 0 0 8px #fff4',
              maskImage: `radial-gradient(circle at var(--spot-x) var(--spot-y), #fff, transparent 150px)`
            }
          }
        },
        ['hover', 'active']
      )
    }),
    plugin(({ addUtilities }) => {
      addUtilities({
        '.no-native-scrollbar': {
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        }
      })
    })
  ]
}

module.exports = config
