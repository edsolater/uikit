/** 将有序 JSS 内容节点写成 CSS 字符串。 */
import type { JSSContentNode } from './style-nodes-to-content-nodes'
import { hasJSSContentOutput } from '../content'
import { propertyName } from '../key'

/** 读取已解析的内容链；解析阶段留下的替代结果在这里生效。 */
function contentToCSSString(input: unknown, resolvedContents: WeakMap<object, unknown>, reading = new Set<object>()): string | undefined {
  if (input === undefined) return undefined
  if (typeof input === 'string' || typeof input === 'number') return String(input)
  if (input === null || (typeof input !== 'object' && typeof input !== 'function')) throw new Error('无效的 CSS 内容。')
  if (reading.has(input)) throw new Error('CSS 内容存在循环引用，无法生成 CSS。')
  reading.add(input)
  try {
    if (resolvedContents.has(input)) {
      const resolved = resolvedContents.get(input)
      if (resolved !== input) return contentToCSSString(resolved, resolvedContents, reading)
    }
    if (!hasJSSContentOutput(input)) throw new Error('CSS 内容仍未完成自身解析或输出。')
    return input.toCSSString((child) => contentToCSSString(child, resolvedContents, reading))
  } finally {
    reading.delete(input)
  }
}

/** 按节点地址输出 CSS 内容；同址重复声明保持原序。 */
export function contentNodesToCSSString(contentNodes: JSSContentNode[]): string {
  let openHeaders: string[] = []
  const lines: string[] = []
  for (const node of contentNodes) {
    const content = contentToCSSString(node.content, node.resolvedContents)
    if (content === undefined) continue
    const nextHeaders = node.conditionPath.map((condition) => condition.header).filter((header) => header !== undefined)
    let sharedDepth = 0
    while (sharedDepth < openHeaders.length && sharedDepth < nextHeaders.length && openHeaders[sharedDepth] === nextHeaders[sharedDepth]) sharedDepth++
    for (let index = openHeaders.length; index > sharedDepth; index--) lines.push('}')
    for (const header of nextHeaders.slice(sharedDepth)) lines.push(`${header} {`)
    lines.push(node.key === undefined ? content : `${propertyName(node.key)}: ${content};`)
    openHeaders = nextHeaders
  }
  for (let index = openHeaders.length; index > 0; index--) lines.push('}')
  return lines.join('\n')
}
