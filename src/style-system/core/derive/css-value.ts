/** 将基本 CSS 值保存为可命名、可共享的对象。 */
import { block, type Block, type BlockOptions } from '../css-block'

/** 用于属性或其他值表达的 Block，变量和组合值保留相同的对象能力。 */
export interface Value extends Block {
  kind: 'value' | 'variable'
}

/** 保存原始数值或文本，只有最终解析才转换为字符串。
 * @example
 * const thin = value('2px')
 * const independent = thin()
 */
export function value(raw: string | number, options?: Pick<BlockOptions, 'dependence' | 'onActive'>): Value & { raw: string | number } {
  return block({ kind: 'value' as 'value', raw }, {
    ...options,
    /** 输出当前值，不提前缓存字符串。 */
    parseCss() { return String(this.raw) },
  })
}
