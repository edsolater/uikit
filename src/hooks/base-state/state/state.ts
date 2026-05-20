/**
 * State 协议定义与身份标记入口。
 *
 * 这个文件处在 base-state 的协议定义阶段，
 * 只负责定义什么是 State，以及怎样把一个可调用读取器登记成受管控的 State。
 *
 * 它负责：
 * - 定义 State<T> 协议。
 * - 提供 toState 与 isState。
 * - 维护 State 的最小身份标记。
 *
 * 它不负责：
 * - 读取 MayState 的当前值。
 * - 创建 signal/store 容器。
 * - 处理 set 输入、连接、替换或断开。
 *
 * 相邻分工：
 * - read.ts 负责值读取边界。
 * - derive.ts 负责派生新的 State。
 * - 未来的 set.ts 负责写入输入协议。
 */
import type { Accessor } from 'solid-js'
import { isFunction, isObject } from '@edsolater/fnkit'

const stateSymbol = Symbol('StateBrand')

/**
 * 所有状态都应该满足这个契约
 */
export interface State<T> {
  (): T
  [stateSymbol]: true
  [Symbol.dispose](): void
}

/**
 * 方便以后统一管控
 */
const registeredStateSet = new WeakSet<Accessor<unknown>>()

/**
 * 给新增新创造的state打标签，认定它是个安全且记录在案的state
 */
export function toState<T>(value: Accessor<T> | State<T>): State<T> {
  if (isState(value)) {
    return value
  }
  if (!isFunction(value)) {
    throw new Error('只能注册callable类型的 state')
  }
  //@ts-expect-error 因为是强行新增属性，所以肯定有类型错误。
  value[stateSymbol] = true
  //@ts-expect-error 因为是强行新增属性，所以肯定有类型错误。
  value[Symbol.dispose] = () => {
    registeredStateSet.delete(value)
  }

  // 注册state，以便于未来的管控
  registeredStateSet.add(value)

  return value as State<T>
}

/**
 * 判断一个值是否是我们创造的 state。
 * 在管理用的 createState中使用
 */
export function isState(mayState: unknown): mayState is State<unknown> {
  return (
    isFunction(mayState) &&
    (registeredStateSet.has(mayState) || (isObject(mayState) && (mayState as any)?.[stateSymbol] === true))
  )
}
