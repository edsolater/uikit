/** 按稳定身份把 stylesheet 根挂载到所属 Document。 */
import type { CssBox } from './css-box'
import { parseCssStylesheet } from './parse-css-stylesheet'

interface MountedStylesheet {
  root: CssBox
  style: HTMLStyleElement
}

const stylesheetsByDocument = new WeakMap<Document, Map<string, MountedStylesheet>>()

/**
 * 连接 stylesheet 根；相同 Document、身份与根的重复调用沿用已有 style。
 *
 * @example
 * mountCssStylesheet(document, import.meta.url, stylesheetBox(selectorBox('.Card', cssBlocks.display('block'))))
 */
export function mountCssStylesheet(document: Document, identity: string, root: CssBox): HTMLStyleElement {
  let stylesheets = stylesheetsByDocument.get(document)
  if (!stylesheets) {
    stylesheets = new Map()
    stylesheetsByDocument.set(document, stylesheets)
  }

  const mounted = stylesheets.get(identity)
  if (mounted?.style.isConnected && mounted.root === root) return mounted.style

  const cssText = parseCssStylesheet(root, document)
  const existingStyle = mounted?.style.isConnected
    ? mounted.style
    : [...document.head.querySelectorAll<HTMLStyleElement>('style[data-uikit-css]')].find(
        (style) => style.dataset.uikitCss === identity,
      )

  const style = existingStyle ?? document.createElement('style')
  style.dataset.uikitCss = identity
  if (style.textContent !== cssText) style.textContent = cssText
  if (!style.isConnected) document.head.append(style)
  stylesheets.set(identity, { root, style })
  return style
}
