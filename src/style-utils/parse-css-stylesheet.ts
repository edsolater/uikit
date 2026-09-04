/** 在 stylesheet 最终输出边界解释完整 CssBox、CssBlock 与 CssValue 结果树。 */
import { isCssBlock, readCssBlock } from './css-block'
import { isCssBox, readCssBox, type CssBox, type CssBoxContent, type CssBoxRecord } from './css-box'
import { cssKey } from './css-key'
import { parseCssValue } from './parse-css-value'

/** 从 stylesheet 根开始递归压平全部可达结果，并在同一路径激活 values。 */
export function parseCssStylesheet(root: CssBox, document: Document): string {
  const record = readCssBox(root)
  if (record.kind !== 'stylesheet') throw new Error('只有 StylesheetBox 可以作为 parse 根。')
  return parseCssBoxRecord(record, document, 0, false)
}

/** 按当前结构上下文解释一个 box 记录。 */
function parseCssBoxRecord(
  record: CssBoxRecord,
  document: Document,
  depth: number,
  declarationsAllowed: boolean,
): string {
  if (record.kind === 'stylesheet' && depth > 0) throw new Error('StylesheetBox 不能挂载到其他 CssBox 中。')

  const hasHeader = record.kind === 'selector' || record.kind === 'atRule'
  const contentDepth = hasHeader ? depth + 1 : depth
  const contentAllowsDeclarations = hasHeader || (record.kind === 'anonymous' && declarationsAllowed)
  const lines = record.content
    .map((content) => parseCssBoxContent(content, document, contentDepth, contentAllowsDeclarations))
    .filter(Boolean)

  if (!hasHeader) return lines.join('\n')
  const header = indent(depth) + record.header + ' {'
  return header + (lines.length ? '\n' + lines.join('\n') + '\n' : '\n') + indent(depth) + '}'
}

/** 保持内容对象的原始身份直到这里，再决定它应如何进入最终 CSS。 */
function parseCssBoxContent(
  content: CssBoxContent,
  document: Document,
  depth: number,
  declarationsAllowed: boolean,
): string {
  if (isCssBlock(content)) {
    return parseCssBoxRecord(readCssBox(readCssBlock(content)), document, depth, declarationsAllowed)
  }
  if (isCssBox(content)) return parseCssBoxRecord(readCssBox(content), document, depth, declarationsAllowed)
  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    throw new Error('CssBox 内容必须是 declarations、CssBox 或 CssBlock。')
  }
  if (!declarationsAllowed) {
    const firstKey = Object.keys(content)[0]
    throw new Error('CssKey “' + String(firstKey) + '”不能直接挂载到 StylesheetBox。')
  }

  return Object.entries(content)
    .filter((entry) => entry[1] !== undefined)
    .map(([name, value]) => indent(depth) + cssKey(name) + ': ' + parseCssValue(value!, document) + ';')
    .join('\n')
}

/** 生成最终 CSS 的稳定两空格缩进。 */
function indent(depth: number): string {
  return '  '.repeat(depth)
}
