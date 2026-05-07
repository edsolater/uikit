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
