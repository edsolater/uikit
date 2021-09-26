import shrinkToValue from '@edsolater/fnkit/src/magic/shrinkToValue'
import { toKebabCase } from '@edsolater/fnkit/src/string/changeCase'
import { Nullish, Stringish } from '../../typings/constants'

/**
 *
 * @param el
 * @param variableName
 * @param value
 * @example
 * setCssVarible(document.getElementById('he'), 'isActive', true)
 */
export function setCssVarible(
  el: HTMLElement | Nullish,
  variableName: string | undefined,
  value: Stringish | ((prev: string) => Stringish)
): void {
  if (el && variableName) {
    el.style.setProperty(
      `--${toKebabCase(variableName)}`,
      String(shrinkToValue(value, [el.style.getPropertyValue(`--${toKebabCase(variableName)}`)]))
    )
  }
}

/**
 *
 * @param el
 * @param variableName
 * @example
 * getCssVariable(document.getElementById('he'), 'isActive')
 */
export function getCssVariable(el: HTMLElement | Nullish, variableName: string | undefined): string {
  if (el && variableName) {
    return el.style.getPropertyValue(`--${toKebabCase(variableName)}`)
  }
  return ''
}
