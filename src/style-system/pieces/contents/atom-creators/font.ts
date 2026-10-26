/** 字体简写配置。 */

import { token, type Token, type TokenInput } from '../../../token'

export interface FontParts {
  style?: TokenInput
  weight?: TokenInput
  size: TokenInput
  lineHeight?: TokenInput
  family: TokenInput
}

/**
 * 延迟生成字体简写。
 */
export function fontValue(parts: FontParts): Token<FontParts> {
  return token<FontParts>(
    { default: parts },
    {
      dependencies: (parts) => [
        parts.style,
        parts.weight,
        parts.size,
        parts.lineHeight,
        parts.family,
      ],
      toCSSString: (parts, resolve) => {
        const style = resolve(parts.style)
        const weight = resolve(parts.weight)
        const size = resolve(parts.size)
        const leading = resolve(parts.lineHeight)
        const family = resolve(parts.family)
        if (size === undefined || family === undefined) return undefined
        return [
          style,
          weight,
          leading === undefined ? size : `${size}/${leading}`,
          family,
        ]
          .filter((part) => part !== undefined)
          .join(' ')
      },
    },
  )
}
