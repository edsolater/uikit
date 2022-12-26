import { inServer } from '../isSSR'
import { handleScroll } from './gesture/handleScroll'

export function scrollIntoView(el: HTMLElement, options?: ScrollIntoViewOptions) {
  const defaultedOptions = Object.assign({ behavior: 'smooth' } as ScrollIntoViewOptions, options)
  return new Promise<void>((resolve) => {
    el.scrollIntoView(defaultedOptions)
    if (inServer) {
      resolve()
      return
    }
    handleScroll(el.parentElement ?? window.document.documentElement, {
      onScrollStop: () => resolve(),
      autoRemoveListener: true
    })
  })
}
