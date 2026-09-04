/** 把 TypeScript 样式规则转换并注册到浏览器 Document。 */
import type { CSSRule } from './css-rule'


export interface CSSStyleSheetDefinition {
  layer?: string
  rules: readonly CSSRule[]
}

const registeredCSSByDocument = new WeakMap<Document, Map<string, HTMLStyleElement>>()

/** 按输入顺序把规则定义转换成浏览器可执行的 CSS 文本。 */
export function createCSSStyleSheetText({ layer, rules }: CSSStyleSheetDefinition): string {
  const rulesText = rules
    .map(({ selector, declarations }) => {
      const declarationsText = Object.entries(declarations)
        .filter((entry) => entry[1] !== undefined)
        .map(([property, value]) => '  ' + property + ': ' + String(value) + ';')
        .join('\n')

      return selector + ' {\n' + declarationsText + '\n}'
    })
    .join('\n\n')

  if (!layer) return rulesText

  const layeredRulesText = rulesText
    .split('\n')
    .map((line) => '  ' + line)
    .join('\n')

  return '@layer ' + layer + ' {\n' + layeredRulesText + '\n}'
}

/** 按样式身份在一个 Document 中注册 CSS；同一身份只保留一个 style。 */
export function registerCSS(ownerDocument: Document, path: string, cssText: string): void {
  let registeredCSS = registeredCSSByDocument.get(ownerDocument)
  if (!registeredCSS) {
    registeredCSS = new Map()
    registeredCSSByDocument.set(ownerDocument, registeredCSS)
  }

  const registeredStyle = registeredCSS.get(path)
  const currentStyle = registeredStyle?.isConnected
    ? registeredStyle
    : [...ownerDocument.head.querySelectorAll<HTMLStyleElement>('style[data-uikit-css]')].find(
        (style) => style.dataset.uikitCss === path,
      )

  if (currentStyle) {
    if (currentStyle.textContent !== cssText) currentStyle.textContent = cssText
    registeredCSS.set(path, currentStyle)
    return
  }

  const style = ownerDocument.createElement('style')
  style.dataset.uikitCss = path
  style.textContent = cssText
  ownerDocument.head.append(style)
  registeredCSS.set(path, style)
}
