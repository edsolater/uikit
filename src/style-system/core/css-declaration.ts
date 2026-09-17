/** 用二元数组把 CSS Key 与尚未取值的内容配成一条声明。 */
import { isCSSKey, type CSSKey } from './css-key'
import type { ValueInput } from './css-value'

/** 一条尚未编译的 CSS 声明；第一项是声明受体，第二项是完整内容，undefined 表示本条声明无效。 */
export type Declaration<C = ValueInput | undefined> = [key: CSSKey, content: C]

/** 判断数组是否已经到达以 CSS Key 开始的键值对，不再继续展开它的内容。 */
export function isCSSPair(input: unknown): input is Declaration<unknown> {
  return Array.isArray(input) && input.length === 2 && isCSSKey(input[0])
}

/**
 * 把一个 Key 与一份可选内容配成声明二元数组；不登记 Rule，也不读取或扩写内容。
 * content 为 undefined 时仍返回完整 Declaration，交给 rules() 忽略本条声明。
 * Key 自身决定内容的编译语法；多个有序内容使用一个数组表达。
 * @example
 * declare('color', 'red') // 编译为 color: red。
 * declare($padding, ['4px', '8px']) // 编译为上/下 4px、右/左 8px。
 */
export function declare<C = ValueInput | undefined>(key: CSSKey, content: C): Declaration<C>
export function declare(key: CSSKey, content: unknown): Declaration<unknown> {
  return [key, content]
}
