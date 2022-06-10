export function attachBoundingBoxCSSVariable(el: HTMLElement) {
  const rect = el.getBoundingClientRect()
  el.style.setProperty('--left', String(rect.left))
  el.style.setProperty('--right', String(rect.right))
  el.style.setProperty('--top', String(rect.top))
  el.style.setProperty('--bottom', String(rect.bottom))
  el.style.setProperty('--width', String(rect.width))
  el.style.setProperty('--height', String(rect.height))
}
