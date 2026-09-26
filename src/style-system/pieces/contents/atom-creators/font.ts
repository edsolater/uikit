/** 字体简写配置。 */

import { type JSSContent, createJSSContent } from "../../../content"
import type { ValueInput } from "../../../value"

export interface FontParts {
  style?: ValueInput
  weight?: ValueInput
  size: ValueInput
  lineHeight?: ValueInput
  family: ValueInput
}

/** 延迟生成字体简写。 */
export function fontValue(parts: FontParts): JSSContent {
  return createJSSContent(
    (read) => {
      const style = read(parts.style)
      const weight = read(parts.weight)
      const size = read(parts.size)
      const leading = read(parts.lineHeight)
      const family = read(parts.family)
      if (size === undefined || family === undefined) return undefined
      return [style, weight, leading === undefined ? size : `${size}/${leading}`, family]
        .filter((part) => part !== undefined)
        .join(' ')
    },
    [parts.style, parts.weight, parts.size, parts.lineHeight, parts.family],
  )
}
