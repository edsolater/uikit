import tailwindClassMap from './tailwindClassMap'

const getCSSPropertyName = (tailwindFeatureClass: string) => tailwindClassMap.get(tailwindFeatureClass)

const getFeatureName = (tailwindClass: string) =>
  tailwindClass
    .replace(/\[.*\]/, '')
    .replace(/-\d+/, '')
    .replace(/^-/, '')
    .replace(/-$/, '')
// TODO: haven't consider about  css shortcut \ taildwind class to multi css properties yet
/**
 *
 * @example
 * mergeTailwindClass('m-4', '-mx-5', 'flex flex-row', 'justify-between justify-around justify-items-center') //=> 'm-4 -mx-5 flex flex-row justify-around justify-items-center'
 *
 */
export function mergeTailwindClass(...longClassNames: string[]) {
  const allClassNames = longClassNames
    .flatMap((l) => l.split(' '))
    .map((c, idx) => ({ originalClass: c, cssProperty: getCSSPropertyName(getFeatureName(c)), index: idx }))
  const uniqueClassNameMap = new Map(
    allClassNames.map(({ cssProperty, originalClass }) => [cssProperty, originalClass])
  )
  return [...uniqueClassNameMap.values()].join(' ')
}
