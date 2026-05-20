/**
 * State 派生入口。
 *
 * 这个文件处在 base-state 的来源变换阶段，
 * 只负责从既有值来源派生新的 State。
 *
 * 它负责：
 * - 把 MayState 变换成新的 State。
 * - 提供 derive 与 createDerived 这两个派生入口。
 *
 * 它不负责：
 * - 创建 signal/store 容器。
 * - 管理 set 输入协议。
 * - 管理活水源连接、替换或断开。
 *
 * 相邻分工：
 * - state.ts 负责 State 协议。
 * - read.ts 负责最终读取。
 * - 未来的 set.ts 负责写入与接管。
 */
import { createMemo } from 'solid-js'
import type { State } from './state'
import { type MayState, $ } from './read'
import { toState } from './state'

/**
 * 从 MayState 派生新的 state
 *
 * `derive()` 不会在调用时把 source 解包成固定值，而是返回一个新的 Accessor。
 * 只有 source 的当前值变化时，派生 Accessor 才会重新通过 fn 计算结果。
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
export function derive<T, U>(source: MayState<T>, fn: (value: T) => MayState<U>): State<U> {
  return toState(createMemo(() => $(fn($(source)))))
}

/**
 * 更可读的是使用 {@link derive},
 * 但有时我们确实需要在一个纯函数里写一些派生逻辑，这时 createDerived 就很方便，当然知道这是一个逃生舱，而且这个在思维节点中比较重。
 * @param fn
 * @returns
 */
export function createDerived<T>(fn: () => MayState<T>): State<T> {
  return toState(createMemo(() => $(fn())))
}

/**
 * 快速工具， 反转boolen
 * TODO: 可以考虑放到 fnkit 里，
 * 此函数是为了考虑可读性，因为如果只是符号（=>），比如各种箭头、感叹号这种，可读性不佳。
 */
export const flip = (value: boolean): boolean => !value
