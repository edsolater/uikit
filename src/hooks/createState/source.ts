/**
 * Source 领域。
 *
 * 本文件定义可以继续传递给组件、hook 与能力 options 的值来源协议。
 * 它只描述合法输入形态，不负责读取 Source，也不执行向 StateView 的转换。
 */
import type { MayArray } from '@edsolater/fnkit'
import { isPromiseLike } from './promise-like'
import { isStateView, type StateView } from './state-view'

/**
 * PromiseLike 只有在目标值允许 pending 的 undefined 时，才能直接成为该值的 Source。
 * PromiseLike 也可以完成为继续承载目标值的 StateView，由最终读取入口继续归一化。
 */
type PromiseLikeSource<V> =
  [V & undefined] extends [never]
    ? never
    : PromiseLike<V | StateView<Exclude<V, undefined>>>

/** 可以稳定转换成 StateView<V> 的对象。 */
export type StateViewable<V> = StateView<V> | PromiseLikeSource<V>

/**
 * 可以被组件 props、hook 参数或能力 options 继续传递的值来源。
 *
 * `Source<V>` 表示一个当前值为 V，或能够稳定转换成 `StateView<V>` 的对象。
 * 普通 PromiseLike 只能作为 `Source<V | undefined>`；
 * 如需排除 undefined，应在最终转换或读取时提供 defaultValue。
 *
 * 需要继续向下传递时保留 Source；只有在最终消费点才通过 val() 读取当前值。
 *
 * Source 是从内容值到可接受输入的正向约束，不是携带内容类型身份的容器，因此不可逆。
 * 不要通过 `S extends Source<infer V>` 提取内容值：裸值分支会让 StateView 等包装器既能被解释为
 * Source 包装，也能被解释为内容值本身。需要从实际输入推断读取结果时，应先推断完整的 S，再使用 `Val<S>`。
 */
export type Source<V> = V | StateViewable<V>

/**
 * 一个完整的 Source：它承载单个值或值列表，并允许列表中的每一项独立保持为 Source。
 *
 * MayArraySource 自身已经包含最外层 Source，业务类型不应再次写成
 * `Source<MayArraySource<V>>`，否则会重复表达同一层包装关系。
 */
export type MayArraySource<V> = Source<MayArray<Source<V> | undefined>>

/** 判断未知值是否能够稳定转换为 StateView。 */
export function isStateViewable(value: unknown): value is StateViewable<unknown> {
  return isStateView(value) || isPromiseLike(value)
}
