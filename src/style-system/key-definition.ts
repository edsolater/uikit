/**
 * JSS 属性目标的定义与纯构造。
 *
 * 创建具有 CSS 原名和组合协议的 Key 对象。
 *
 * 让属性定义无需依赖全局名称解析或登记状态。
 */
import type { ContentView } from './content'
import type { TokenInput } from '@/style-system/token/core'

/** 原生属性名称。 */
export interface JSSKeyObject {
  toCSSString(): string
  /** 同完整地址的声明等级；普通 Key 省略时为最高档 999。 */
  priority?: number
  /**
   * 同 Target／State 地址、同属性名至少有两项声明时，
   * 按声明顺序组合内容贡献；省略 join 时默认生成逗号数组。
   *
   * 保留输入视图时，沿用其原声明位置的编译结果；
   * 改写 content 后，新内容在结果位置编译。
   */
  join?: (values: ContentView[]) => TokenInput
}

/** 原生属性名称与可输出的自定义 Key。 */
export interface JSSKeyDefinition<
  K extends string = string,
> extends JSSKeyObject {
  name: K
}

/**
 * 创建属性 Key；name 是输出的 CSS 属性名，join 可改写重复声明的默认数组组合。
 * @example
 * const $stack = key('z-index', {
 *   join: values =>
 *     values.reduce((sum, item) => sum + Number(item.content), 0),
 * })
 * rules('.example', [[$stack, 2], [$stack, 3]])
 * compileCSS().includes('z-index: 5;') // true
 */
export function key<K extends string>(
  name: K,
  options?: Pick<JSSKeyObject, 'join'>,
): JSSKeyDefinition<K> {
  const target: JSSKeyDefinition<K> = {
    name,
    toCSSString: () => name,
    ...options,
  }
  return target
}
