/** 保存属性名及其值对象，最终解析为 CSS 声明。 */
import { block, type Block } from '../css-block'
import type { Value } from './css-value'

/** 属性名和值之间的关系，值对象参与共同激活链。 */
export interface Property extends Block {
  kind: 'property'
  key: string
  value: Value
}

/** 组成属性声明，不复制或提前解析传入的值。
 * @example
 * selector('.button').attach(property('color', variable('foreground')))
 */
export function property(key: string, value: Value): Property {
  return block({ kind: 'property' as 'property', key, value }, {
    /** 从当前属性取得值依赖。 */
    getDependencies() { return [this.value] },
    /** 将当前键值关系解析成声明。 */
    parseCss() { return `${this.key}: ${this.value.parseCss()};` },
  })
}
