/** 按源码路径注册一段全局 CSS；同一路径只保留一个 style。 */
export function registerCSS(
  ownerDocument: Document,
  path: string,
  cssText: string,
): void {
  const currentStyle = [...ownerDocument.head.querySelectorAll<HTMLStyleElement>(
    'style[data-uikit-css]',
  )].find(style => style.dataset.uikitCss === path)
  if (currentStyle) {
    if (currentStyle.textContent !== cssText) currentStyle.textContent = cssText
    return
  }

  const style = ownerDocument.createElement('style')
  style.dataset.uikitCss = path
  style.textContent = cssText
  ownerDocument.head.append(style)
}
