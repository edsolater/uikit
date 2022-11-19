import { flap, MayArray, shakeNil } from '@edsolater/fnkit'

export type HTMLElements = MayArray<HTMLElement | undefined | null>

export function getHTMLElementsFromEls(els: HTMLElements) {
  return shakeNil(flap(els))
}
