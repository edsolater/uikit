/** 在 stylesheet 最终输出边界解释完整容器、block、declaration 与 value 结果树。 */
import { isCssBlock, readCssBlock } from './css-block'
import { isCssBox, readCssBox, type CssBox, type CssBoxContent, type CssBoxRecord } from './css-box'
import { isCssDeclaration, readCssDeclaration, type CssDeclaration } from './css-declaration'
import { parseCssValueResult } from './parse-css-value'
import type { CssValue } from './css-value'

export interface ParsedCssStylesheet {
  cssText: string
  values: CssValue[]
}

/** 从 stylesheet 根开始递归压平全部可达结果。 */
export function parseCssStylesheet(root: CssBox): string {
  return parseCssStylesheetResult(root).cssText
}

/** 交付最终 stylesheet 字符串及解析时真实出现的 value 对象。 */
export function parseCssStylesheetResult(root: CssBox): ParsedCssStylesheet {
  const record = readCssBox(root)
  if (record.kind !== 'stylesheet') throw new Error('只有 stylesheet() 创建的容器可以作为 parse 根。')
  const values = new Set<CssValue>()
  return { cssText: parseCssBox(root, 0, false, values, new Set()), values: [...values] }
}

/** 按当前结构上下文解释一个容器，并阻止挂载环形成无限递归。 */
function parseCssBox(
  box: CssBox,
  depth: number,
  declarationsAllowed: boolean,
  values: Set<CssValue>,
  parsing: Set<CssBox>,
): string {
  if (parsing.has(box)) throw new Error('CssBox 挂载关系形成了循环。')
  parsing.add(box)
  try {
    return parseCssBoxRecord(readCssBox(box), depth, declarationsAllowed, values, parsing)
  } finally {
    parsing.delete(box)
  }
}

/** 按当前结构上下文解释一个已经进入解析路径的容器记录。 */
function parseCssBoxRecord(
  record: CssBoxRecord,
  depth: number,
  declarationsAllowed: boolean,
  values: Set<CssValue>,
  parsing: Set<CssBox>,
): string {
  if (record.kind === 'stylesheet' && depth > 0) throw new Error('stylesheet 根不能挂载到其他容器中。')

  const hasHeader = record.kind === 'selector' || record.kind === 'atRule'
  const contentDepth = hasHeader ? depth + 1 : depth
  const contentAllowsDeclarations = hasHeader || (record.kind === 'anonymous' && declarationsAllowed)
  const lines = record.content
    .map((content) => parseCssBoxContent(content, contentDepth, contentAllowsDeclarations, values, parsing))
    .filter(Boolean)

  if (!hasHeader) return lines.join('\n')
  const header = indent(depth) + record.header + ' {'
  return header + (lines.length ? '\n' + lines.join('\n') + '\n' : '\n') + indent(depth) + '}'
}

/** 在最终边界按内容的真实身份解释它。 */
function parseCssBoxContent(
  content: CssBoxContent,
  depth: number,
  declarationsAllowed: boolean,
  values: Set<CssValue>,
  parsing: Set<CssBox>,
): string {
  if (isCssBlock(content)) {
    return parseCssBox(readCssBlock(content), depth, declarationsAllowed, values, parsing)
  }
  if (isCssBox(content)) return parseCssBox(content, depth, declarationsAllowed, values, parsing)
  if (!isCssDeclaration(content)) throw new Error('CssBox 内容必须是 CssDeclaration、CssBox 或 CssBlock。')
  if (!declarationsAllowed) {
    throw new Error('CssKey “' + readCssDeclaration(content).key + '”不能直接挂载到 stylesheet 根。')
  }
  return parseDeclaration(content, depth, values)
}

/** 把 declaration 一直保留的 key/value 结果交付为 CSS。 */
function parseDeclaration(declaration: CssDeclaration, depth: number, values: Set<CssValue>): string {
  const record = readCssDeclaration(declaration)
  for (const dependency of record.dependencies) values.add(dependency)
  const parsedValue = parseCssValueResult(record.value)
  for (const value of parsedValue.values) values.add(value)
  return indent(depth) + record.key + ': ' + parsedValue.cssText + ';'
}

/** 生成最终 CSS 的稳定两空格缩进。 */
function indent(depth: number): string {
  return '  '.repeat(depth)
}
