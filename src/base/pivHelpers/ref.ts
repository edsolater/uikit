import { isFunction, wrapArr, type AnyFn } from '@edsolater/fnkit'
import { onCleanup } from 'solid-js'
import { type PivDomProps, type PivProps, type RefFunction } from '../Piv'
import { type PivElement, type PivTag } from './domMap'
import { parseEvent } from './events'
import { parseDomProps } from './parseDomProps'

/**
 * ref 是命令式增强入口，允许单个 ref 或一组 ref，并统一回收清理函数。
 */
function bindNormalRefs<T extends Element>(element: T, refList: PivDomProps['ref']) {
  if (!refList) return

  const refs = wrapArr(refList).filter(isFunction) as RefFunction<T>[]
  const cleanups = refs.map((ref) => ref(element)).filter(isFunction) as unknown as AnyFn[]
  if (cleanups.length === 0) return

  onCleanup(() => {
    for (const cleanup of cleanups) {
      cleanup()
    }
  })
}
/**
 * 将 props 转化成 ref
 */
export function fromProps2Ref<Tag extends PivTag>(
  element: PivElement<Tag>,
  inputProps: PivProps<Tag>,
) {
  if (inputProps.domProps) {
    parseDomProps<Tag>(element, inputProps.domProps)
  }

  if (inputProps.events) {
    parseEvent(element, inputProps.events)
  }

  bindNormalRefs(element, inputProps.ref)
}

