import { isFunction, toArray, type AnyFn, type MayArray } from '@edsolater/fnkit'
import { onCleanup } from 'solid-js'
import type { PivTag, PivTargetHTMLElement } from './domMap'

export type RefFunction<T extends Element> = (element?: T) => void
/**
 * ref 是命令式增强入口，允许单个 ref 或一组 ref，并统一回收清理函数。
 */
export function parseNormalRefs<T extends Element, Tag extends PivTag>(
  element: T,
  refList: MayArray<RefFunction<PivTargetHTMLElement<Tag>> | undefined>,
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
