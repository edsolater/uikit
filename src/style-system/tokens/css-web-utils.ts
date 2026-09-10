/** 延迟组合 CSS 颜色表达，并保留颜色对象的激活依赖。 */
import { cssBlock, type CssBlock } from '../core/css-block'

type CssColor = CssBlock

/** CSS 原生 color-mix */
export function cssColorMix(...colors: (CssColor | [color: CssColor, weight: number])[]): CssBlock {
  return cssBlock(
    () =>
      `color-mix(in oklab, ${colors
        .map((paramColor) => {
          const [color, weight] = Array.isArray(paramColor) ? paramColor : [paramColor, undefined]
          return weight === undefined ? color : `${color} ${weight * 100}%`
        })
        .join(', ')})`,
    { dependence: colors.map(color => Array.isArray(color) ? color[0] : color) },
  )
}
