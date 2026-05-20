/**
 * State 读取入口。
 *
 * 这个文件处在 base-state 的最终消费阶段，
 * 只负责定义状态读取边界：`MayState` 表示可以继续传递的值来源，`$` 表示最终消费时的解包动作。
 *
 * 它负责：
 * - 定义 MayState<T>。
 * - 在最终消费点把值来源读取成当前值。
 *
 * 它不负责：
 * - 创建状态。
 * - 修改状态。
 * - 描述 store 字段访问能力。
 * - 管理活水源连接关系。
 */
import type { MayFn } from '@edsolater/fnkit'
import { isExist, isFunction, shrinkFn } from '@edsolater/fnkit'
import { isState, type State } from './state'

/**
 * 可以被组件 props、hook 参数或能力 options 继续传递的值来源。
 *
 * `MayState<T>` 允许调用方同时传入动态状态读取器或已经固定的普通值。
 * 接收方不需要关心上游是动态值还是静态值，只需要在最终消费点用 `$()` 读取当前值。
 *
 * 使用规则：
 * - 需要继续向下传递值来源时，优先保留为 `MayState<T>`。
 * - 只有在 JSX 模板、DOM 副作用、事件计算、调用纯函数等最终消费点，才读取当前值。
 * - 如果需要从 `MayState<T>` 派生新的动态值，应使用 `derive(source, fn)`，不要提前 `$()`。
 *
 * AI 规则：
 * - 不要把 `MayState<T>` 简化成 `T` 后再继续传递；这会丢失动态性。
 * - 不要在 props、options、hook 中间层里提前写 `const value = $(source)`。
 * - 如果目标仍然是传给下游组件、hook、状态逻辑或 DOM 绑定，应继续传 `MayState<T>` 或使用 `derive()`。
 * - 如果没有检索到相关工具实现，应先在当前工具库中查找 `$()`、`derive()`、`MayState`，不要退回到裸函数或一次性快照写法。
 *
 * @example
 * ```ts
 * type ButtonProps = {
 *   disabled?: MayState<boolean>
 *   className?: MayState<string>
 * }
 *
 * function Button(props: ButtonProps) {
 *   const className = derive(props.disabled ?? false, disabled =>
 *     disabled ? 'button disabled' : 'button'
 *   )
 *
 *   return <button disabled={$(props.disabled ?? false)} class={$(className)} />
 * }
 * ```
 */
export type MayState<T> = T | State<T>

/**
 * 读取可传递值来源的当前值。
 *
 * `$()` 会把 `MayState<T>` 读取成当前的普通值：
 * 如果传入的是动态状态读取器，则立即调用它；如果传入的是普通值，则直接返回。
 *
 * `$()` 是最终消费工具，不是中间传递工具。
 * 它只应出现在真正需要当前值的位置，例如 JSX 模板、DOM 副作用、事件计算或调用纯函数之前。
 *
 * 使用规则：
 * - 最终消费当前值时，使用 `$()`。
 * - 继续向下传递动态输入时，保留 `MayState<T>`，不要提前解包。
 * - 需要转换并继续保留动态性时，使用 `derive(source, fn)`。
 * - 第二个参数 `getDefaultValue` 只在当前值为 `null` 或 `undefined` 时执行，用于提供惰性默认值。
 *
 * AI 规则：
 * - 不要把 `$()` 当成通用“规范化”步骤放在函数开头。
 * - 不要写 `const value = $(source)` 后再把 `value` 传给组件、hook、状态逻辑或 DOM 绑定；这会把动态输入变成一次性快照。
 * - 如果代码意图是“从动态值得到另一个动态值”，应使用 `derive(source, fn)`，不要手写 `() => fn($(source))`，除非当前文件确实不能引用 `derive()`。
 * - 如果没有检索到 `$()` 或 `derive()` 的实现，应先在当前工具库中查找它们，而不是退回到裸 accessor、重复实现或提前解包。
 *
 * @example
 * ```ts
 * const visible = () => true
 * const label = 'Submit'
 *
 * $(visible) // true
 * $(label)   // 'Submit'
 *
 * element.hidden = !$(visible) // 最终消费：允许
 *
 * const className = derive(visible, v => v ? 'visible' : 'hidden')
 * element.className = $(className) // 最终消费：允许
 *
 * // bad: 提前解包后继续传递，会丢失动态性
 * const fixedVisible = $(visible)
 * Button({ visible: fixedVisible })
 *
 * // good: 继续传递动态来源
 * Button({ visible })
 * ```
 */
export function $<T>(state: MayState<T>): T
export function $<T>(state: MayState<T> | undefined): T | undefined
export function $<T>(state: MayState<T> | undefined, defaultValue: MayFn<MayState<T>>): T
export function $<T>(state: MayState<T> | undefined, defaultValue?: MayFn<MayState<T>>): T {
  const newState = isExist(state)
    ? state
    : isExist(defaultValue)
      ? readMayFunctionMayStateCore(defaultValue)
      : undefined
  return readMayStateCore(newState) as T
}

/**
 * 只应该由 {@link $} 调用，外部不应该直接使用。
 */
function readMayStateCore<T>(mayState: MayState<T>): T {
  return shrinkFn(mayState) as T
}

/**
 * 只应该由 {@link $} 调用，外部不应该直接使用。
 */
function readMayFunctionMayStateCore<T>(mayFunctionMayState: MayFn<MayState<T>>): MayState<T> {
  if (isFunction(mayFunctionMayState)) {
    if (isState(mayFunctionMayState)) {
      return mayFunctionMayState as State<T>
    } else {
      return mayFunctionMayState() as State<T>
    }
  } else {
    return mayFunctionMayState as MayState<T>
  }
}
