import { Delta2dTranslate } from '@edsolater/fnkit'
import { setCSSVariable } from './setCSS'

export function setTranslate(el: HTMLElement, translateOptions: Partial<Delta2dTranslate>) {
  if (translateOptions.dx) {
    setCSSVariable(el, '--x', (original) => Number(original) + translateOptions.dx!)
  }
  if (translateOptions.dy) {
    setCSSVariable(el, '--y', (original) => Number(original) + translateOptions.dy!)
  }
}
