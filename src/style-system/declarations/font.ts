/** 字体、字号、字重与行高。 */
import { declaration } from '../core/css-declaration'
import { key } from '../core/css-key'
import { parseValue, toValue, type Value } from '../core/css-value'

export interface FontParts {
  /** 正常、斜体等字形风格。 */
  style?: Value | string
  /** 字重。 */
  weight?: Value | string

  /** 字号，与行高通过斜杠分隔。 */
  size: Value | string
  /** 行高；省略时不在简写中指定。 */
  lineHeight?: Value | string

  /** 字体族及其候选顺序。 */
  family: Value | string
}

export const fontKey = key('font')

/**
 * 字体简写；对象明确字号、行高与字体族的归属，也可直接传 inherit 等关键字。
 * @example font({ size: textSize, lineHeight: textLeading, family: 'system-ui' })
 */
export function font(input: FontParts | Value | string) {
  return declaration(fontKey, input, (content, context) => {
    if (typeof content === 'string' || 'kind' in content) return parseValue(content, context)
    const style = content.style === undefined ? '' : `${parseValue(content.style, context)} `
    const weight = content.weight === undefined ? '' : `${parseValue(content.weight, context)} `
    const size = parseValue(content.size, context)
    const leading = content.lineHeight === undefined ? '' : `/${parseValue(content.lineHeight, context)}`
    return `${style}${weight}${size}${leading} ${parseValue(content.family, context)}`
  })
}

export const fontSizeKey = key('font-size')
/** 字号。 */
export const fontSize = (input: Value | string) => declaration(fontSizeKey, toValue(input))

export const fontWeightKey = key('font-weight')
/** 字重。 */
export const fontWeight = (input: Value | string) => declaration(fontWeightKey, toValue(input))

export const lineHeightKey = key('line-height')
/** 行高；无单位数值表示相对字号的倍数。 */
export const lineHeight = (input: Value | string) => declaration(lineHeightKey, toValue(input))
