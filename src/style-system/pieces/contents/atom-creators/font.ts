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
    (resolve) => {
      const style = resolve(parts.style)
      const weight = resolve(parts.weight)
      const size = resolve(parts.size)
      const leading = resolve(parts.lineHeight)
      const family = resolve(parts.family)
      if (size === undefined || family === undefined) return undefined
      return [style, weight, leading === undefined ? size : `${size}/${leading}`, family]
        .filter((part) => part !== undefined)
        .join(' ')
    },
    [parts.style, parts.weight, parts.size, parts.lineHeight, parts.family],
  )
}
