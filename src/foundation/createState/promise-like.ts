/** PromiseLike 协议识别与原生计算转换；身份复用由 stateView 负责。 */
import { hasProperty, isFunction } from '@edsolater/fnkit'
import { createSignal } from 'solid-js'
import { mapStateView } from './state'
import { stateViewBrand, type StateView } from './state-view'

/** 对象公开可调用的 then 时，按 PromiseLike 协议处理。 */
export function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return hasProperty(value, 'then', isFunction)
}

/** 将固定 Promise 交给原生计算，等待和错误由消费者的 UI 边界承担。 */
export function toStateViewFromPromiseLike<V>(promiseLike: PromiseLike<V>): StateView<Awaited<V>> {
  // 固定来源保留完成与失败，避免失去订阅后复读又开始等待；不公开写入端。
  const [read] = createSignal(() => Promise.resolve(promiseLike))
  const view: StateView<Awaited<V>> = {
    read,
    [stateViewBrand]: true,
    map(toNew) { return mapStateView(view, toNew) },
  }
  return view
}
