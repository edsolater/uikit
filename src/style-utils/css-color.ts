/** 用 CssValue 结果表达浏览器原生颜色组合能力。 */
import { cssValueSequence, joinCssValues, type CssValue, type CssValueContent } from './css-value'

export type CssColor = CssValueContent
export type CssWeightedColor = [color: CssColor, weight: number]

/**
 * 把颜色及可选权重保存为可继续组合的 oklab color-mix 结果。
 *
 * @example
 * const surfaceTint = cssColorMix([surface, 0.8], accent)
 */
export function cssColorMix(...colors: (CssColor | CssWeightedColor)[]): CssValue {
  const weightedColors = colors.map((color) => {
    if (!Array.isArray(color)) return color
    return cssValueSequence(color[0], ' ', color[1] * 100, '%')
  })
  return cssValueSequence('color-mix(in oklab, ', joinCssValues(', ', ...weightedColors), ')')
}
