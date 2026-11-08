/**
 * 状态的常用派生工具。
 *
 * 沿用来源的响应式映射，让调用处以具名操作表达转换目的。
 */
import type { StateView } from './state-view'

/**
 * 将状态视图的当前值转换为字符串，并保留后续响应式更新。
 * @example
 * const text = toStateString(createState(false))
 * val(text) // 'false'
 */
export function toStateString(state: StateView<boolean>): StateView<'true' | 'false'>
export function toStateString<T>(state: StateView<T>): StateView<string>
export function toStateString<T>(state: StateView<T>): StateView<string> {
  return state.map(String)
}
