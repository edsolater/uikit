import composeStringArrays from './composeStringArrays'

const mapGen: Array<{ tailwind: string | string[]; cssProperty: string }> = [
  { tailwind: 'mt', cssProperty: 'margin-top' },
  { tailwind: 'mr', cssProperty: 'margin-right' },
  { tailwind: 'mb', cssProperty: 'margin-bottom' },
  { tailwind: 'mx', cssProperty: ['margin-left', 'margin-right'].join(' ') },
  { tailwind: 'my', cssProperty: ['margin-top', 'margin-bottom'].join(' ') },
  { tailwind: 'ml', cssProperty: 'margin-left' },
  { tailwind: 'm', cssProperty: 'margin' },
  { tailwind: 'flex', cssProperty: 'display' },
  { tailwind: ['flex-row', 'flex-row-reverse', 'flex-col', 'flex-col-reverse'], cssProperty: 'flex-direction' },
  {
    tailwind: ['justify-start', 'justify-end', 'justify-center', 'justify-between', 'justify-around', 'justify-evenly'],
    cssProperty: 'justify-content'
  },
  {
    tailwind: ['justify-items-start', 'justify-items-end', 'justify-items-center', 'justify-items-sketch'],
    cssProperty: 'justify-items'
  },
  {
    tailwind: [
      'justify-self-auto',
      'justify-self-start',
      'justify-self-end',
      'justify-self-center',
      'justify-self-sketch'
    ],
    cssProperty: 'justify-self'
  }
]
const tailwindClassMap: [string, string][] = mapGen.flatMap(
  ({ tailwind, cssProperty }) =>
    composeStringArrays('%1: %2', [tailwind].flat(), [cssProperty].flat()).map((s) => s.split(': ')) as [
      string,
      string
    ][]
)

export default new Map(tailwindClassMap)
