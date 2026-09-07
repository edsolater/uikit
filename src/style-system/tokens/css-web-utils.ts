import { cssValue, toCssString, type CssValue } from '../core/css-value'

type CssColor = CssValue

/** CSS 原生 color-mix */
export function cssColorMix(...colors: (CssColor | [color: CssColor, weight: number])[]): CssValue {
  return cssValue(
    () =>
      `color-mix(in oklab, ${colors
        .map((paramColor) => {
          const [color, weight] = Array.isArray(paramColor) ? paramColor : [paramColor, undefined]
          return weight === undefined ? color : `${toCssString(color)} ${weight * 100}%`
        })
        .join(', ')})`,
  )
}
