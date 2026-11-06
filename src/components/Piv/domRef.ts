/** 消费元素引用声明，并随声明和元素退出释放资源。 */
import { createRenderEffect } from '@/foundation'
import { mapArray } from '@/foundation/render'
import { isFunction, toArray, type MayArray } from '@edsolater/fnkit'
import type { PivHTMLElement, PivTag } from './domMap'
import type { RefReceiver } from '@/hooks/createRef'

export type PivDomRef<Tag extends PivTag = 'div'> = MayArray<
  RefReceiver<PivHTMLElement<Tag>> | undefined
>

export function consumeDomRefs<Tag extends PivTag>(
  element: PivHTMLElement<Tag>,
  readRefList: () => PivDomRef<Tag>,
) {
  mapArray(
    () => toArray(readRefList()).filter(isFunction),
    (ref) => {
      createRenderEffect(
        () => ref,
        (receiver) => receiver(element),
      )
      return ref
    },
  )
}
