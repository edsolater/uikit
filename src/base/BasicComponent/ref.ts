/**
 * 这个文件消费 Piv 的用户 ref 声明。
 * ref 是命令式逃生口；声明式 DOM 能力应优先落到 class、style、htmlProps 或 on。
 */
import { isFunction, toArray, type AnyFn } from '@edsolater/fnkit'
import { onCleanup } from 'solid-js'
import type { PivProps } from './Piv'
import type { PropValueWrapper } from './type'
import type { PivHTMLElement, PivTag } from './domMap'

type RefFunction<T extends Element> = (element?: T) => void

export type PivRef<Tag extends PivTag = 'div'> = PropValueWrapper<RefFunction<PivHTMLElement<Tag>>>
/**
 * 执行 ref 并统一回收 ref 返回的 cleanup。
 */
export function parseNormalRefs<T extends Element, Tag extends PivTag>(
  element: T,
  refList:PivProps<Tag>['ref'],
) {
  const refs = toArray(refList).filter(isFunction) as RefFunction<T>[]
  const cleanups = refs.map((ref) => ref(element)).filter(isFunction) as unknown as AnyFn[]
  if (cleanups.length === 0) return

  onCleanup(() => {
    for (const cleanup of cleanups) {
      cleanup()
    }
  })
}
