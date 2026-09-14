/** 边框的宽度、线型、颜色和圆角。 */
import { declaration, type Declaration } from '../../core/css-declaration'
import { key } from '../../core/css-key'
import { joinValues, toValue, type Value } from '../../core/css-value'

export const borderKey = key('border')
export const borderColorKey = key('border-color')

/**
 * 边框宽度、线型与颜色按输入顺序组合，不识别或重排各部分。
 * @example border(distance, 'solid', foreground)
 */
export function border(...parts: (Value | string)[]): Declaration<'border'> {
  return declaration(borderKey, joinValues(' ', ...parts))
}

export const borderRadiusKey = key('border-radius')
/** 边框圆角半径。 */
export const borderRadius = (input: Value | string): Declaration<'border-radius'> =>
  declaration(borderRadiusKey, toValue(input))
