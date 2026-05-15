import type { Accessor } from 'solid-js'
import type { State } from './createState'

/**
 * State 读取入口。
 *
 * 该文件定义状态消费边界：
 * `MayState` 表示可以被继续传递的值来源，`$` 表示最终消费时的解包动作。
 *
 * 它不负责创建状态、修改状态，也不负责描述 store 字段访问能力。
 */

/**
 * 可以被组件 props 或能力 options 继续传递的值来源。
 *
 * 它可能是可订阅状态读取器，也可能是已经解包的普通值。
 * 接收方不需要关心上游是动态状态还是静态值，只在最终消费点用 `$()` 取当前值。
 */
export type MayState<T> = T | State<T>

/**
 * 解包可传递的值来源。
 *
 * `$()` 只应出现在最终消费者附近，例如 JSX 模板、DOM 副作用、事件计算或调用纯函数之前。
 * 继续向下传递动态输入时，优先传 `MayState`，不要提前解包成普通值。
 */
export function $<T>(state: MayState<T>): T {
  return typeof state === 'function' ? (state as Accessor<T>)() : state
}

/**
 * 从 MayState 派生新的 Accessor。
 *
 * `derive()` 不会在调用时把 source 解包成固定值，而是返回一个新的 Accessor。
 * 每次读取派生 Accessor 时，都会重新读取 source 的当前值，再通过 fn 计算结果。
 *
 * 适用于需要继续向下传递动态值的场景，例如派生 class、style、props、
 * disabled、aria 属性或中间计算结果。
 *
 * 使用规则：
 * - 继续传递动态值时，使用 `derive(source, fn)`。
 * - 最终消费当前值时，使用 `$()`。
 * - 不要先 `$(source)` 再把结果传给下游；这会丢失响应性。
 *
 * AI rules：
 * - 如果需要从 `MayState<T>` 计算出新的动态值，优先使用 `derive(source, fn)`。
 * - 不要手写 `() => fn($(source))`，除非当前文件确实不能引用 `derive()`。
 * - 不要把 `const value = $(source)` 当成中间状态继续传递给组件、hook、状态逻辑或 DOM 绑定。
 * - 如果没有检索到 `derive()` 的实现，也应先在当前工具库中查找它，而不是退回到裸 accessor 写法。
 *
 * @example
 * ```ts
 * const active = () => true
 * const width = () => 120
 *
 * const className = derive(active, v => v ? 'active' : 'inactive')
 * const widthPx = derive(width, n => `${n}px`)
 *
 * Button({ className, width: widthPx }) // 继续传递动态值
 *
 * element.className = $(className) // 最终消费当前值
 * ```
 */
export function derive<T, U>(source: MayState<T>, fn: (value: T) => U): Accessor<U> {
  return () => fn($(source))
}
