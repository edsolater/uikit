/** CSS 字体内容。 */
import { cssContent } from '../../value'
import type { CSSFunction, ValueInput } from '../../value'

/** 字体简写配置。 */
export interface FontParts {
  style?: ValueInput
  weight?: ValueInput
  size: ValueInput
  lineHeight?: ValueInput
  family: ValueInput
}

/** 延迟生成字体简写。 */
export function fontValue(parts: FontParts): CSSFunction {
  return cssContent((read) => {
    const style = read(parts.style)
    const weight = read(parts.weight)
    const size = read(parts.size)
    const leading = read(parts.lineHeight)
    const family = read(parts.family)
    if (size === undefined || family === undefined) return undefined
    return [style, weight, leading === undefined ? size : `${size}/${leading}`, family]
      .filter((part) => part !== undefined).join(' ')
  })
}
