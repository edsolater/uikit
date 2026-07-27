/**
 * State 读取入口。
 *
 * 这个文件处在 base-state 的最终消费阶段，
 * 只负责定义状态读取边界：`Source` 表示可以继续传递的值来源，`val()` 表示最终消费时的解包动作。
 *
 * 它负责：
 * - 定义 Source<T>。
 * - 在最终消费点把值来源读取成当前值。
 * - 为可转换的 PromiseLike 请求并读取稳定的 StateView。
 *
 * 它不负责：
 * - 定义 PromiseLike 与 StateView 的身份映射。
 * - 主动创建或修改业务 State。
 * - 描述 store 字段访问能力。
 * - 管理活水源连接关系。
 */
import type { MayFn } from '@edsolater/fnkit'
import { isExist, shrinkFn } from '@edsolater/fnkit'
import { isPromiseLike } from './promise-like'
import { isStateView, toStateView, type StateView } from './state'

/**
 * 可以被组件 props、hook 参数或能力 options 继续传递的值来源。
 *
 * `Source<T>` 允许调用方传入可以稳定转换成 `StateView<T>` 的对象，或已经固定的普通值。
 * 接收方不需要关心上游是动态值还是静态值，只需要在最终消费点用 `val()` 读取当前值。
 *
 * 使用规则：
 * - 需要继续向下传递值来源时，优先保留为 `Source<T>`。
 * - 只有在 JSX 模板、DOM 副作用、事件计算、调用纯函数等最终消费点，才读取当前值。
 * - 普通 PromiseLike 只能作为 `Source<T | undefined>`；需要稳定默认值时，应先通过 `toStateView()` 转换。
 *
 * AI 规则：
 * - 不要把 `Source<T>` 简化成 `T` 后再继续传递；这会丢失动态性。
 * - 不要在 props、options、hook 中间层里提前写 `const value = val(source)`。
 * - 如果目标仍然是传给下游组件、hook、状态逻辑或 DOM 绑定，应继续传 `Source<T>`。
 * - 如果没有检索到相关工具实现，应先在当前工具库中查找 `val()` 与 `Source`，不要退回到裸函数或一次性快照写法。
 *
 * @example
 * ```ts
 * type ButtonProps = {
 *   disabled?: Source<boolean>
 *   className?: Source<string>
 * }
 *
 * function Button(props: ButtonProps) {
 *   const className = state(props.disabled ?? false)
 *
 *   return <button disabled={val(props.disabled ?? false)} class={val(className)} />
 * }
 * ```
 */
export type StateViewable<V> =
  | StateView<V>
  | (undefined extends V ? PromiseLike<V> : never)

/**
 * 一个当前值为 V，或能够稳定转换成 StateView<V> 的值来源。
 */
export type Source<V> = V | StateViewable<V>

/**
 *
 * 【表目的（使用名词动词化），工具函数】读取 source 当前值。
 *
 * `val()` 会把 `Source<T>` 读取成当前值：
 * 如果传入的是动态状态读取器，则继续读取；如果传入的是 PromiseLike，则读取其 StateView；
 * 如果传入的是普通值，则直接返回。
 * PromiseLike 在 pending 或 rejected 时读取为 undefined，fulfilled 后写入 StateView 并触发响应式消费者更新。
 *
 * 它不负责深层 snapshot；如果确实需要把对象树里的 readable state 一起解包，调用方应显式使用 `snapshot()`。
 *
 * `val()` 是最终消费工具，不是中间传递工具。
 * 它只应出现在真正需要当前值的位置，例如 JSX 模板、DOM 副作用、事件计算或调用纯函数之前。
 *
 * 使用规则：
 * - 最终消费当前值时，使用 `val()`。
 * - 继续向下传递动态输入时，保留 `Source<T>`，不要提前解包。
 * - 第二个参数 `getDefaultValue` 只在当前值为 `null` 或 `undefined` 时执行，用于提供惰性默认值。
 *
 * AI 规则：
 * - 不要把 `val()` 当成通用“规范化”步骤放在函数开头。
 * - 不要在响应式计算中现场创建新的 PromiseLike 再交给 `val()`；新的实例会建立新的 StateView。
 * - 不要写 `const value = val(source)` 后再把 `value` 传给组件、hook、状态逻辑或 DOM 绑定；这会把动态输入变成一次性快照。
 * - 如果代码意图是“从动态值保持动态性地推导出另一个值”，应继续保留为 `StateView` 或 `Source`，不要提前 `val()`。
 * - 如果没有检索到 `val()` 的实现，应先在当前工具库中查找它，而不是退回到裸 accessor、重复实现或提前解包。
 *
 * @example 组件中使用
 * ```ts
 * const visible = state(true)
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
 * ```
 *
 */
export function val<V>(source: PromiseLike<V>): Awaited<V> | undefined
export function val<V>(source: Source<V>): V
export function val<V>(source: Source<V> | undefined): V | undefined
export function val<V>(source: Source<V> | undefined, defaultValue: MayFn<Source<V>>): V
export function val<V>(source: Source<V> | undefined, defaultValue?: MayFn<Source<V>>) {
  const nextSource = isExist(source) ? source : isExist(defaultValue) ? val(shrinkFn(defaultValue)) : undefined
  return readSource(nextSource)
}

/**
 * 只应该由 {@link val} 调用，外部不应该直接使用。
 */
function readSource<V>(source: Source<V>): V
function readSource<V>(source: Source<V> | undefined): V | undefined
function readSource<V>(source: Source<V> | undefined): V | undefined {
  if (isStateView(source)) {
    return source.read()
  }
  if (isPromiseLike(source)) {
    // 这里把转换结果作为 val() 的临时读取媒介使用；toStateView() 本身不限定 StateView 的生命周期。
    return toStateView(source).read() as V | undefined
  }
  return source as V | undefined
}
