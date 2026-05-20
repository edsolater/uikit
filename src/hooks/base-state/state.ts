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
