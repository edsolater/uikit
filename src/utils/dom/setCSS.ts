import { toKebabCase, isNumber, isObject, MayFn, shrinkToValue, Nullish } from '@edsolater/fnkit'
import { CSSProperties } from 'react'

/**
 * side-effect
 * @param el target html element
 * @param styleObject
 * @example
 * setStyle(document.getElementById('he'), 'background', 'red')
 */
export function setInlineStyle(
  el: HTMLElement | Nullish,
  styleObject: { [K in keyof CSSProperties]: MayFn<CSSProperties[K], [prevValue: string]> }
): void

/**
 * side-effect
 * @param el target html element
 * @param variableName
 * @param value
 * @example
 * setStyle(document.getElementById('he'), 'background', 'red')
 */
export function setInlineStyle<K extends keyof CSSProperties>(
  el: HTMLElement | Nullish,
  variableName: K,
  value: MayFn<CSSProperties[K], [prevValue: string]>
): void

export function setInlineStyle(el: HTMLElement | Nullish, ...params) {
  const styleObject = isObject(params[0]) ? params[0] : { [params[0]]: params[1] }
  Object.entries(styleObject).forEach(([variableName, value]) => {
    if (el && variableName) {
      const stylePropertyName = toKebabCase(variableName)
      const styleValue = toPx(shrinkToValue(value, [el.style.getPropertyValue(toKebabCase(variableName))]))
      el.style.setProperty(stylePropertyName, styleValue)
    }
  })
}

function toPx(v: any) {
  return isNumber(v) ? `${v}px` : v
}
/**
 *
 * @param el target html element
 * @param variableName
 * @example
 * getStyle(document.getElementById('he'), 'background')
 */
export function getInlineCSS<K extends keyof CSSProperties>(
  el: HTMLElement | Nullish,
  variableName: K
): Exclude<CSSProperties[K], number> | '' {
  if (el && variableName) {
    return el.style.getPropertyValue(variableName) as Exclude<CSSProperties[K], number>
  }
  return ''
}

/**
 *
 * @param el target html element
 * @param variableName variable should include '--' prefix (for clearer readiblity)
 * @param value
 * @example
 * setCssVarible(document.getElementById('he'), '--is-active', true)
 */
export function setCSSVariable(
  el: HTMLElement | Nullish,
  variableName: `--${string}` | undefined,
  value: string | number | ((prev: string) => string | number)
): void {
  if (el && variableName) {
    el.style.setProperty(variableName, String(shrinkToValue(value, [el.style.getPropertyValue(variableName)])))
  }
}

/**
 *
 * @param el target html element
 * @param variableName variable should include '--' prefix (for clearer readiblity)
 * @example
 * getCssVariable(document.getElementById('he'), '--is-active')
 */
export function getCSSVariable(el: HTMLElement | Nullish, variableName: `--${string}` | undefined): string {
  if (el && variableName) {
    return el.style.getPropertyValue(variableName)
  }
  return ''
}
