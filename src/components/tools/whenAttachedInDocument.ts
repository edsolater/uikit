import { isArray, type AbortSignal } from '@edsolater/fnkit'

/**
 * 等元素接入文档后返回同一元素。
 *
 * @param signal 调用方先退出时，用 FNKit 的取消信号结束等待，避免元素迟迟未挂载时 Promise 一直挂起。
 *   等待引用或挂载期间取消，都会以原取消原因拒绝，并解除已启动的观察。
 * @param observeRoot 默认观察元素所属文档及当前所在的影子树。
 *   元素将插入其他文档或尚未进入的影子树时，传入目标根才能收到那里的插入通知。
 * @example
 * const element = await whenAttachedInDocument(domProxy, signal, shadowRoot)
 */
export async function whenAttachedInDocument<T extends Element>(
  dom: T | PromiseLike<T>,
  signal?: AbortSignal | AbortSignal[],
  observeRoot?: Document | ShadowRoot,
): Promise<T> {
  const signals = isArray(signal) ? signal : signal ? [signal] : []
  for (const item of signals) item.throwIfAborted()
  const { promise, resolve, reject } = Promise.withResolvers<T>()
  let observer: MutationObserver | undefined
  const subscriptions = signals.map(item => item.onAbort(() => reject(item.reason)))
  try {
    Promise.resolve(dom).then(element => {
      if (signals.some(item => item.aborted)) return
      if (element.isConnected) return resolve(element)
      observer = new MutationObserver(() => {
        if (element.isConnected) resolve(element)
      })
      const options = { childList: true, subtree: true }
      const documentRoot = observeRoot?.ownerDocument ?? observeRoot ?? element.ownerDocument
      observer.observe(documentRoot, options)
      // 影子树内的插入和宿主接入文档分别发生在两个观察边界。
      let root: Node = observeRoot ?? element.getRootNode()
      while (root.nodeType === Node.DOCUMENT_FRAGMENT_NODE && 'host' in root) {
        observer.observe(root, options)
        root = (root as ShadowRoot).host.getRootNode()
      }
    }).catch(reject)
    return await promise
  } finally {
    observer?.disconnect()
    for (const subscription of subscriptions) subscription.unsubscribe()
  }
}
