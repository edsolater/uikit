/**
 * 这个文件消费 Piv 的 domRef 声明。
 * domRef 是原生元素的命令式入口，声明式能力优先落到 class、style、htmlProps 或 on。
 */
import { onCleanup } from '@/foundation'
import { isFunction, toArray, type MayArray } from '@edsolater/fnkit'
import type { PivHTMLElement, PivTag } from './domMap'
import type { RefReceiver } from '@/hooks/createRef'

export type PivDomRef<Tag extends PivTag = 'div'> = MayArray<
  RefReceiver<PivHTMLElement<Tag>> | undefined
>
/**
 * 执行 domRef 并统一回收接收器返回的 cleanup。
 */
export function consumeDomRefs<Tag extends PivTag>(
  element: PivHTMLElement<Tag>,
  refList: PivDomRef<Tag>,
) {
  const refs = toArray(refList).filter(isFunction)
  const cleanups = refs.map((ref) => ref(element)).filter(isFunction)
  if (cleanups.length === 0) return

  onCleanup(() => {
    for (const cleanup of cleanups) {
      cleanup()
    }
  })
}
