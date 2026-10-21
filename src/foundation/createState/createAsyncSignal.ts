import { isFunction } from '@edsolater/fnkit'
import {
  createMemo,
  createSignal,
  type SignalOptions,
  type MemoOptions,
  type Setter,
  type SourceAccessor,
} from 'solid-js'

type AsyncValue<T> = T | PromiseLike<T>

type StateSource<T> = AsyncValue<T> | (() => AsyncValue<T>)

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
   * 首次读取时才开始计算，并沿用 Solid 的自动释放语义：
   * 失去全部订阅后释放计算，再次读取时重新计算。
   * 内部两层同时应用此选项。
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
   * 抑制 Solid 对所属计算作用域内写入的开发期诊断。
   * 只用于可写的来源层；不改变更新调度，默认不主动开启。
   */
  ownedWrite?: SignalOptions<T>['ownedWrite']
}

/**
 * 统一读取同步值和异步结果，支持计算来源与后续写入。
 * 等待、失败及依赖更新由 Solid 管理。
 */
export function createAsyncSignal<T>(
  initialSource: StateSource<T>,
  options?: AsyncSignalOptions<T>,
): [SourceAccessor<T>, Setter<AsyncValue<T>>] {
  // 保存可写的来源，并保留初始计算函数的响应式依赖。
  // lazy 同时作用于来源层，避免外层延迟、内层却提前执行。
  const [readSource, setter] = createSignal<AsyncValue<T>>(
    () => (isFunction(initialSource) ? initialSource() : initialSource),
    { lazy: options?.lazy },
  )

  // 后续写入可能直接保存 Promise，此计算将其交给 Solid 解包。
  // equals、loadingValue 等选项统一针对外界读取的结果 T。
  const accessor = createMemo<T>(() => readSource(), options)

  return [accessor, setter]
}
