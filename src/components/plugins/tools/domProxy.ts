import {
  AbortController,
  toPromiseResultProxy,
  type AbortSignal,
  type PromiseResultProxy,
} from '@edsolater/fnkit'
import { onCleanup } from '@/foundation'
import { isDisposed, runWithOwner, type getOwner } from '@/foundation/reactivity'
import { whenAttachedInDocument } from '../../tools/whenAttachedInDocument'

export type DomProxy<T extends HTMLElement> = PromiseResultProxy<T> & {
  /** 等待元素接入文档；插件所属作用域先退出时返回 false。 */
  isReady(observeRoot?: Document | ShadowRoot): Promise<boolean>
}

/** 为首次 DOM 引用提供就绪查询，保留原代理的属性、方法与 Promise 协议。 */
export function createDomProxy<T extends HTMLElement>(
  first: Promise<T>,
  owner: ReturnType<typeof getOwner>,
): DomProxy<T> {
  let signal: AbortSignal | undefined
  if (owner) {
    const lifetime = new AbortController()
    signal = lifetime.signal
    if (isDisposed(owner)) lifetime.abort()
    else runWithOwner(owner, () => onCleanup(() => lifetime.abort()))
  }
  const proxy = toPromiseResultProxy(first)
  async function isReady(observeRoot?: Document | ShadowRoot) {
    try {
      await whenAttachedInDocument(first, signal, observeRoot)
      return !signal?.aborted
    } catch (error) {
      if (signal?.aborted && error === signal.reason) return false
      throw error
    }
  }
  return new Proxy(proxy, {
    get(target, key) {
      return key === 'isReady' ? isReady : Reflect.get(target, key)
    },
    has(target, key) {
      return key === 'isReady' || Reflect.has(target, key)
    },
  }) as DomProxy<T>
}
