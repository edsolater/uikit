/**
 * Source 的最终读取边界：递归读取 StateView 与 PromiseLike，普通值原样返回。
 * 来源身份与转换由 stateView 负责；val 只在消费点取得当前值。
 */
import { isExist, result, type ResultValue, type Primitive } from '@edsolater/fnkit'
import { isStateViewable, type Source } from './source'
import { stateView, type StateView } from './state-view'

/** 解除 PromiseLike 与 StateView 包装后得到的最终读取值。 */
export type Val<S> =
  S extends PromiseLike<infer InnerS>
    ? Val<Awaited<InnerS>>
    : S extends StateView<infer InnerS>
      ? Val<InnerS>
      : S

/**
 * 读取来源的当前完成值；在响应式计算中调用时跟踪相应依赖。
 * 继续传递动态输入时保留 Source，不把 val 的当前结果当成来源。
 *
 * 等待与失败由 Solid 传播；defaultValue 只用于完成后的 null/undefined。
 * 函数默认值仅在选中时求值，其结果仍按同一读取协议处理。
 *
 * Promise 来源应保持稳定；不要在每次响应式读取时现场创建新 Promise。
 * 需要持续异步计算时，使用 createState 的计算来源或 map。
 *
 * @example 组件中使用
 * const visible = createState(true)
 * const label = 'Submit'
 *
 * val(visible) // true
 * val(label)   // 'Submit'
 *
 * element.hidden = !val(visible) // 最终消费：允许
 *
 * const className = derive(visible, v => v ? 'visible' : 'hidden')
 * element.className = val(className) // 最终消费：允许
 *
 * // bad: 提前解包后继续传递，会丢失动态性
 * const fixedVisible = val(visible)
 * Button({ visible: fixedVisible })
 *
 * // good: 继续传递动态来源
 * Button({ visible })
 *
 */

export function val<S extends Primitive>(source: S): S
export function val<R>(source: PromiseLike<R>): Val<PromiseLike<R>>
export function val<V>(source: StateView<V>): Val<StateView<V>>
/**
 * 这是常用 Source<V> 正向契约的便捷重载，不代表 Source 可以被可靠反推。
 * 极少数完全不透明的泛型 S 可能无法得到完美推断，但不应因此把复杂度扩散到所有业务类型。
 */
export function val<V>(source: Source<V>): Awaited<V>
export function val<S>(source: S): Val<S>
export function val<S, const DefaultValue>(
  source: S,
  defaultValue: DefaultValue,
): Exclude<Val<S>, null | undefined> | Val<ResultValue<DefaultValue>>
export function val(source: any, defaultValue?: any) {
  const value = isStateViewable(source) ? val(stateView(source).read()) : source
  return !isExist(value) && arguments.length > 1
    ? val(result(defaultValue))
    : value
}
