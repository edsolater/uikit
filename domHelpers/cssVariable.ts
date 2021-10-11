import { fall } from '@edsolater/fnkit/src/magic'
type GlobalCssVariable = '--side-menu-width' | '--topbar-height'

export const registCSSVariable = (cssvariableName: GlobalCssVariable, value: string | number) =>
  document.documentElement.style.setProperty(cssvariableName, String(value))

export const getCSSVariable = (
  cssVariableName: GlobalCssVariable,
  options?: {
    unit?: 'px'
    /** @example 'calc($0 / 2)' */
    calcStr?: string
  }
) => {
  return fall(cssVariableName, [
    (name) => (options?.unit ? `calc(var(${name}) * 1${options.unit})` : `var(${name})`),
    (united) => (options?.calcStr ? options.calcStr.replace('$0', united) : united)
  ])
}
