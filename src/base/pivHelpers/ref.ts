import { isFunction, toArray, type AnyFn } from '@edsolater/fnkit'
import { onCleanup } from 'solid-js'
import type { PivProps } from '../Piv'
import type { PropValueWrapper } from '../type'
import type { PivHTMLElement, PivTag } from './domMap'

type RefFunction<T extends Element> = (element?: T) => void

export type PivRef<Tag extends PivTag = 'div'> = PropValueWrapper<RefFunction<PivHTMLElement<Tag>>>
/**
 * ref 是命令式增强入口，允许单个 ref 或一组 ref，并统一回收清理函数。
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
