/**
 *
 * @param el
 * @param propertyName
 * @param value
 * @example
 * setDateSet(document.getElementById('he'), 'isActive', true)
 */
export function setDataSet(
  el: HTMLElement | undefined | null,
  propertyName: string | undefined,
  value: string | number
): void {
  if (el && propertyName) {
    el.dataset[propertyName] = String(value)
  }
}
