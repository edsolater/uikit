/**
 * State 读取入口。
 *
 * 这个文件处在 base-state 的最终消费阶段，
 * 只负责定义状态读取边界：`Source` 表示可以继续传递的值来源，`val()` 表示最终消费时的解包动作。
 *
 * 它负责：
 * - 定义 Source<T>。
 * - 在最终消费点把值来源读取成当前值。
 *
 * 它不负责：
 * - 创建状态。
 * - 修改状态。
 * - 描述 store 字段访问能力。
 * - 管理活水源连接关系。
 */
import type { MayFn } from '@edsolater/fnkit'
import { isExist, shrinkFn } from '@edsolater/fnkit'
import { createState, isStateView, isState, type StateView } from './state'

/**
 * 可以被组件 props、hook 参数或能力 options 继续传递的值来源。
 *
 * `Source<T>` 允许调用方同时传入动态状态读取器或已经固定的普通值。
 * 接收方不需要关心上游是动态值还是静态值，只需要在最终消费点用 `val()` 读取当前值。
 *
 * 使用规则：
 * - 需要继续向下传递值来源时，优先保留为 `Source<T>`。
 * - 只有在 JSX 模板、DOM 副作用、事件计算、调用纯函数等最终消费点，才读取当前值。
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
export type Source<T> = T | StateView<T>

/**
 *
 * 【表目的（使用名词动词化），工具函数】读取 source 当前值。
 *
 * `val()` 会把 `Source<T>` 读取成当前值：
 * 如果传入的是动态状态读取器，则继续读取；如果传入的是普通值，则直接返回。
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
export function val<T>(source: Source<T>): T
export function val<T>(source: Source<T> | undefined): T | undefined
export function val<T>(source: Source<T> | undefined, defaultValue: MayFn<Source<T>>): T
export function val<T>(source: Source<T> | undefined, defaultValue?: MayFn<Source<T>>) {
  const nextSource = isExist(source) ? source : isExist(defaultValue) ? val(shrinkFn(defaultValue)) : undefined
  return readSource(nextSource)
}

/**
 * 只应该由 {@link val} 调用，外部不应该直接使用。
 */
function readSource<T>(source: Source<T>): T
function readSource<T>(source: Source<T> | undefined): T | undefined
function readSource<T>(source: Source<T> | undefined): T | undefined {
  return isStateView(source) ? source.read() : (source as T | undefined)
}

/**
 * 【工具函数:转换包装器】Source => StateView
 *
 *
 * 因为 {@link toStateView} 更不可主动改变，所以它比 {@link createState} 更轻量
 *
 *
 * - {@link toStateView} 是一个明确的转换操作，所以它第二个参数是一个可选的mapper;
 * - {@link createState} 是名词做动词的操作，第二个也是mapper， 但语义是创建一个新的状态，保持和输入同步；如果输入是个函数，则它是一个惰性初始值函数。
 *
 * @params mapFn 可选的映射函数，用于在转换过程中对值进行变换；如果提供了 mapFn，toStateView 会先把 source 读取成当前值，再传给 mapFn 进行转换，最后把转换结果包装成 StateView 返回。
 *
 * @example
 * ```ts
 * const readable = toStateView(source)
 * ```
 */
export function toStateView<T, U extends T = T>(
  sourceOrValue: Source<T>,
  mapFn?: (value: T) => U,
): StateView<U> {
  if (isStateView(sourceOrValue) || isState(sourceOrValue)) {
    if (mapFn) {
      return sourceOrValue.map(mapFn as any)
    } else {
      //@ts-ignore
      return sourceOrValue
    }
  }

  const baseState = createState(sourceOrValue as T)
  //@ts-ignore
  return mapFn ? baseState.map(mapFn) : baseState
}
