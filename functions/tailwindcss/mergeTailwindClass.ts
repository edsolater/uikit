import tailwindClassMap from './tailwindFeaturePart.json'

const getCSSPropertyName = (tailwindFeatureClass: string): string =>
  tailwindClassMap[tailwindFeatureClass]

/**
 *
 * @example
 * mergeTailwindClass('m-4', '-mx-5', 'flex flex-row', 'justify-between justify-around justify-items-center') //=> 'm-4 -mx-5 flex flex-row justify-around justify-items-center'
 * mergeTailwindClass('flex sm:-mx-5 justify-between justify-around', 'grid sm:mx-2 dark:lg:mx-5') //=> 'grid sm:mx-2 justify-around dark:lg:mx-5' 
 *
 */
export default function mergeTailwindClass(...longClassNames: string[]): string {
  const allClassNames = longClassNames
    .flatMap((l) => l.split(' '))
    .map((c) => ({
      originalClass: c,
      cssProperty: getCSSPropertyName(getTailwindClassFeaturePart(c)),
      prefix: getClassNameVariant(c)
    }))
  const uniqueClassNameMap = new Map(
    allClassNames.map(({ cssProperty, originalClass, prefix }) => [
      [...prefix, cssProperty].join(''),
      originalClass
    ])
  )
  return [...uniqueClassNameMap.values()].join(' ')
}


function getClassNameVariant(selector: string) {
  return Array.from(selector.match(/([\w-]+):/g) || [])
}

function getTailwindClassFeaturePart(selector: string) {
  const main = selector
    .replace(/^-/, '')
    .replace(/[\w-]+\\:/g, '')
    .replace(/::?[\w-]+/g, '')
  const featureString = main
    .split('-')
    .map((t) => (isTailwindClassText(t) ? t : ''))
    .join('-')
  return featureString
}

function isTailwindClassText(text: string) {
  const sizeKeywords = [
    'xs',
    'sm',
    'md',
    'lg',
    'xl',
    '2xl',
    '3xl',
    '4xl',
    '5xl',
    '6xl',
    '7xl',
    '8xl',
    '9xl'
  ]
  const lengthKeywords = ['full', 'px', 'screen']
  const keywords = [...sizeKeywords, ...lengthKeywords]
  return text && !keywords.includes(text) && !/\[.+\]/.test(text) && !/^[\d|\\|\.|/]+$/.test(text)
}
