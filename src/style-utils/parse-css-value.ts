/** 在最终 CSS 输出边界解释 CssValue 结果树并执行可达激活行为。 */
import { activateCssValue } from './css-value-activation'
import {
  isCssValue,
  isCssValueParts,
  readCssValueParts,
  type CssValue,
  type CssValueContent,
  type CssValueParts,
} from './css-value'

/** 递归解释完整 value 结果；此前的所有组合阶段都应保留这个结果。 */
export function parseCssValue(content: CssValueContent, document?: Document): string {
  return parseCssValueContent(content, document, new Set())
}

/** 沿当前结果树压平一个节点，并阻止 value 或片段组自引用形成无限递归。 */
function parseCssValueContent(
  content: CssValueContent,
  document: Document | undefined,
  parsing: Set<object>,
): string {
  if (isCssValueParts(content)) return parseNestedContent(content, document, parsing)
  if (!isCssValue(content)) return String(content)
  return parseNestedValue(content, document, parsing)
}

/** 在原位置解释一组有序片段。 */
function parseNestedContent(parts: CssValueParts, document: Document | undefined, parsing: Set<object>): string {
  if (parsing.has(parts)) throw new Error('CssValue 内容形成了循环。')
  parsing.add(parts)
  try {
    return readCssValueParts(parts)
      .map((part) => parseCssValueContent(part, document, parsing))
      .join('')
  } finally {
    parsing.delete(parts)
  }
}

/** 读取一个 value 的当前结果，并仅在最终解析路径中触发它的生命周期。 */
function parseNestedValue(value: CssValue, document: Document | undefined, parsing: Set<object>): string {
  if (parsing.has(value)) throw new Error('CssValue 内容形成了循环。')
  parsing.add(value)
  try {
    const cssText = parseCssValueContent(value.cssString(), document, parsing)
    if (document) {
      activateCssValue(value, document, (content) => parseCssValueContent(content, document, parsing))
    }
    return cssText
  } finally {
    parsing.delete(value)
  }
}
