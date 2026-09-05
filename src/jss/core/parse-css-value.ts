/** 在最终 CSS 输出边界把 CssValue 结果树解释为字符串。 */
import {
  isCssValue,
  isCssValueParts,
  readCssValueParts,
  type CssValue,
  type CssValueContent,
  type CssValueParts,
} from './css-value'

export interface ParsedCssValue {
  cssText: string
  values: CssValue[]
}

/** 递归解释完整 value 结果；此前的所有组合阶段都应保留这个结果。 */
export function parseCssValue(content: CssValueContent): string {
  return parseCssValueResult(content).cssText
}

/** 交付最终字符串及解析时真实出现的 value 对象，不执行它们的生命周期。 */
export function parseCssValueResult(content: CssValueContent): ParsedCssValue {
  const values = new Set<CssValue>()
  return { cssText: parseCssValueContent(content, new Set(), values), values: [...values] }
}

/** 沿当前结果树压平一个节点，并阻止 value 或片段组自引用形成无限递归。 */
function parseCssValueContent(
  content: CssValueContent,
  parsing: Set<object>,
  values: Set<CssValue>,
): string {
  if (isCssValueParts(content)) return parseNestedContent(content, parsing, values)
  if (!isCssValue(content)) return String(content)
  return parseNestedValue(content, parsing, values)
}

/** 在原位置解释一组有序片段。 */
function parseNestedContent(parts: CssValueParts, parsing: Set<object>, values: Set<CssValue>): string {
  if (parsing.has(parts)) throw new Error('CssValue 内容形成了循环。')
  parsing.add(parts)
  try {
    return readCssValueParts(parts)
      .map((part) => parseCssValueContent(part, parsing, values))
      .join('')
  } finally {
    parsing.delete(parts)
  }
}

/** 在最终解析路径读取一个 value 的当前结果。 */
function parseNestedValue(value: CssValue, parsing: Set<object>, values: Set<CssValue>): string {
  if (parsing.has(value)) throw new Error('CssValue 内容形成了循环。')
  parsing.add(value)
  values.add(value)
  try {
    return parseCssValueContent(value.cssString(), parsing, values)
  } finally {
    parsing.delete(value)
  }
}
