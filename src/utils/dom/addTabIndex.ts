import { addEventListener } from './addEventListener'

/** as long ass apply this on a elemment, press key `Enter` / `(Space)` equal to mouse click  */
export function addTabIndex(el: HTMLElement | undefined | null, options?: { tabIndex?: number }) {
  if (!el) return
  if (el.tagName !== 'BUTTON' || options?.tabIndex !== 0) {
    Reflect.set(el, 'tabIndex', options?.tabIndex || 0)
  }
  addEventListener(
    el,
    'keydown',
    ({ ev }) => {
      switch (ev.key) {
        case ' ': {
          el.click()
          break
        }
        case 'Enter': {
          el.click()
          break
        }
      }
    },
    { capture: true }
  )
}
