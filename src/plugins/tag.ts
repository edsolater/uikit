/** TODO: placeholeder yet please imply it */

import { WeakerMap } from '@edsolater/fnkit'
import { useEffect, useRef } from 'react'
import { HTMLElements } from '../utils/dom/getHTMLElementsFromEls'
import { createNormalPlugin } from './createPlugin'

const nodeStore = new WeakerMap<string, { el: HTMLElement; parent: HTMLElements }>()
export function usePluginTag(
  tagName: string,
  options?: {
    /**
     * if two element have same parent node. they share same context
     **/
    sameContextAs?: HTMLElements
  }
): HTMLElement[] {
  const { sameContextAs } = options ?? {}
  return []
}
export const tag = createNormalPlugin((tagName: string) => {
  const divRef = useRef<HTMLElement>()
  useEffect(() => {}, [divRef])
  return { domRef: divRef }
})
