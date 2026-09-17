/** 边框保留有序组成部分，编译器负责组合。 */
import { declaration } from '../core/css-declaration'
import { key } from '../core/css-key'
import type { ValueInput } from '../core/css-value'

/** border 简写声明的属性位置。 */
export const borderKey = key('border')
/** border-color 声明的属性位置。 */
export const borderColorKey = key('border-color')
/** border-radius 声明的属性位置。 */
export const borderRadiusKey = key('border-radius')

/** 创建 border 简写 Declaration；保留组成值顺序，编译时用空格连接。 */
export function border(...parts: [ValueInput, ...ValueInput[]]) {
  return declaration(borderKey, parts, 'border')
}

/** 创建 border-radius Declaration；完整 Value 留到编译时取值。 */
export const borderRadius = (input: ValueInput) => declaration(borderRadiusKey, input)
