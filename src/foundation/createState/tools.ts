/**
 * 状态的常用派生工具。
 *
 * 沿用来源的响应式映射，让调用处以具名操作表达转换目的。
 */
import { stateView, type StateView } from './state-view'
import { val } from './read'

/**
 * 将状态视图的当前值转换为字符串，并保留后续响应式更新。
 * @example
 * const text = toStateString(createState(false))
 * val(text) // 'false'
 */
export function toStateString(
  state: StateView<boolean>,
): StateView<'true' | 'false'>
export function toStateString<T>(state: StateView<T>): StateView<string>
export function toStateString<T>(state: StateView<T>): StateView<string> {
  return state.map(String)
}

/**
 * 为来源的完成值提供默认值，保留响应式更新，不写入原状态。
 * 沿用 val 的等待与默认语义：仅 null／undefined 回退，函数默认值在选中时求值。
 */
export function withDefault<S, const DefaultValue>(
  source: S,
  defaultValue: DefaultValue,
) {
  return stateView(() => val(source, defaultValue))
}
