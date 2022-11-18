import { flap, isObject, MayArray, shakeNil } from  '@edsolater/fnkit'
import { RefObject } from 'react'

export type HTMLElementRefs = MayArray<RefObject<HTMLElement | undefined | null> | HTMLElement | undefined | null>

export function getHTMLElementsFromRefs(refs: HTMLElementRefs) {
  return shakeNil(flap(refs).map((ref) => (isObject(ref) && 'current' in ref ? ref.current : ref)))
}
