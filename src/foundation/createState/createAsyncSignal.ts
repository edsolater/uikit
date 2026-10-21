import { isFunction } from '@edsolater/fnkit'
import {
  createMemo,
  createSignal,
  type SignalOptions,
  type MemoOptions,
  type SourceAccessor,
  untrack,
} from 'solid-js'
import { isPromiseLike } from './promise-like'

export type AsyncValue<T> = T | PromiseLike<T>

export type StateSource<T> = AsyncValue<T> | (() => AsyncValue<T>)

/** 保存当前来源结果，待完成的 Promise 可继续接续更新。 */
interface SourceResult<T> {
  result: AsyncValue<T>
}

/** 更新函数始终接收完成值；异步来源通过 Promise 链依次转换。 */
export type StateUpdate<T> = AsyncValue<T> | ((previous: T) => AsyncValue<T>)

export type AsyncSignalSetter<T> = (value: StateUpdate<T>) => AsyncValue<T>

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
   * 首次读取或写入时开始计算。
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
  const sourceOptions: SignalOptions<SourceResult<T>> & MemoOptions<SourceResult<T>> = {
    name: options?.name === undefined ? undefined : `${options.name}:source`,
    equals: false,
    lazy: options?.lazy,
    ownedWrite,
  }

  // 来源层保存当前结果，更新函数才能等待 Promise 并接着转换完成值。
  // 普通输入直接保存；计算来源交给 Solid 跟踪依赖及按需执行。
  const [readSource, setSource] = isFunction(initialSource)
    ? createSignal<SourceResult<T>>(() => captureResult(initialSource()), sourceOptions)
    : createSignal<SourceResult<T>>(captureResult(initialSource), sourceOptions)

  // 后续写入可能直接保存 Promise，此计算将其交给 Solid 解包。
  // equals、loadingValue 等选项统一针对外界读取的结果 T。
  const accessor = createMemo<T>(() => readSource().result, resultOptions)

  const setter: AsyncSignalSetter<T> = update => {
    // 首次写入也会使用状态；先初始化 lazy 来源，避免首次派生覆盖这次写入。
    untrack(readSource)
    return setSource(previous => {
      if (!isFunction(update)) return captureResult(update)
      // 使用原生 setter 的待提交来源，连续更新不会重复读取旧的已提交结果。
      const result = previous.result
      const next = isPromiseLike(result) ? result.then(update) : update(result)
      // 这里只转换值，不在 Promise 完成后另行写状态；等待和过期结果仍交给结果层管理。
      return captureResult(next)
    }).result
  }

  return [accessor, setter]
}

/** 保存来源结果，并观察被替换而未进入结果层的 Promise 拒绝。 */
function captureResult<T>(result: AsyncValue<T>): SourceResult<T> {
  if (!isPromiseLike(result)) return { result }
  // 标准 Promise 吸收 thenable 的嵌套结果，等待与失败传播仍由 Solid 负责。
  const promise = Promise.resolve(result)
  promise.then(undefined, () => {})
  return { result: promise }
}
