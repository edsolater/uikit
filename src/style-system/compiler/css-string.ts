/** 按 parsed 语义节点顺序生成 CSS 字符串。 */
import type { ParsedStyleNode } from './style-nodes'

/** 从可输出的 parsed 内容依路径开闭 CSS 块。 */
export function toCSSString(parsedStyleNodes: ParsedStyleNode[]): string {
  let openHeaders: string[] = []
  const lines: string[] = []
  for (const node of parsedStyleNodes) {
    const nextHeaders = node.conditionPath.map((condition) => condition.header).filter((header) => header !== undefined)
    let sharedDepth = 0
    while (sharedDepth < openHeaders.length && sharedDepth < nextHeaders.length && openHeaders[sharedDepth] === nextHeaders[sharedDepth]) sharedDepth++
    for (let index = openHeaders.length; index > sharedDepth; index--) lines.push('}')
    for (const header of nextHeaders.slice(sharedDepth)) lines.push(`${header} {`)
    lines.push(node.key === undefined ? node.value : `${node.key}: ${node.value};`)
    openHeaders = nextHeaders
  }
  for (let index = openHeaders.length; index > 0; index--) lines.push('}')
  return lines.join('\n')
}
