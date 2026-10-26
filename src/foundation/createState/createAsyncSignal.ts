import { isFunction } from '@edsolater/fnkit'
import {
  createMemo,
  createSignal,
  type SignalOptions,
  type MemoOptions,
  type SourceAccessor,
} from 'solid-js'
import { isPromiseLike } from './promise-like'

export type AsyncValue<T> = T | PromiseLike<T>

export type StateSource<T> = AsyncValue<T> | (() => AsyncValue<T>)

/** 相对更新以已有当前值为前提；已有 Promise 的等待由基础层接续。 */
export type StateUpdate<T> = AsyncValue<T> | ((previous: T) => AsyncValue<T>)

export type AsyncSignalSetter<T> = (value: StateUpdate<T>) => void

export interface AsyncSignalOptions<T> {
  /** 对外状态的调试名称；内部来源名称由此派生。 */
  name?: MemoOptions<T>['name']

  /**
   * 比较完成后的值，返回 true 时不通知消费者。
   * 默认沿用 Solid 的相等判断；false 表示每次都通知。
   * 来源层固定使用 equals: false，由结果层统一执行此判断。
   */
  equals?: MemoOptions<T>['equals']

  /**
   * 首次读取时开始计算，写入遵循 Solid 的原生时序。
   * 无订阅时结果层可释放，写入来源仍保留；再次读取会重新计算结果。
   */
  lazy?: MemoOptions<T>['lazy']

  /**
   * 首次异步结果完成前对外提供的值，必须属于 T。
   * 只用于结果层；不是错误回退值，也不是每次更新的占位值。
   */
  loadingValue?: MemoOptions<T>['loadingValue']

  /**
   * 对外结果失去全部订阅时调用。
   * 只登记在结果层，避免内部两层重复调用。
   */
  unobserved?: MemoOptions<T>['unobserved']

  /**
   * 显式允许所属计算作用域内写入。
   * 仅用于来源层，默认不启用，不改变调度。
   */
  ownedWrite?: SignalOptions<T>['ownedWrite']
}

/**
 * 统一读取同步值和异步结果，支持计算来源与后续写入。
 * 等待、失败及依赖更新由 Solid 管理。
 */
export function createAsyncSignal<T>(
  initialSource: StateSource<T>,
  options?: AsyncSignalOptions<Awaited<T>>,
): [SourceAccessor<Awaited<T>>, AsyncSignalSetter<Awaited<T>>]
export function createAsyncSignal<T>(
  initialSource: StateSource<T>,
  options?: AsyncSignalOptions<T>,
): [SourceAccessor<T>, AsyncSignalSetter<T>] {
  const { ownedWrite, ...resultOptions } = options ?? {}

  // 来源层保留原生可写计算与依赖关系，相等比较统一由结果层负责。
  const sourceOptions = {
    name: options?.name === undefined ? undefined : `${options.name}:source`,
    equals: false as const,
    lazy: options?.lazy,
    ownedWrite,
  }
  const [readSource, setSource] = isFunction(initialSource)
    ? createSignal<AsyncValue<T>>(initialSource, sourceOptions)
    : createSignal<AsyncValue<T>>(
        initialSource as Exclude<AsyncValue<T>, Function>,
        sourceOptions,
      )

  // 原生 setter 可以保存 Promise；结果层统一展开 thenable，交给 Solid 等待和传播错误。
  const accessor = createMemo<T>(() => {
    const source = readSource()
    return isPromiseLike(source) ? Promise.resolve(source) : source
  }, resultOptions)

  const setter: AsyncSignalSetter<T> = (update) => {
    setSource((previous) => {
      if (!isFunction(update)) return update
      // 只接续已经存在的异步值，不保存尚无初始结果时的更新命令。
      return isPromiseLike(previous)
        ? Promise.resolve(previous).then(update)
        : update(previous)
    })
  }

  return [accessor, setter]
}
