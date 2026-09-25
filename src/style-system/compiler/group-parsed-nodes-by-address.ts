/** 保守重排可输出节点，保留会影响层叠的声明顺序。 */
import type { ParsedStyleNode } from './style-nodes'

/** 同层同地址共同输出；只跨越互不覆盖的声明。 */
export function groupParsedNodesByAddress(nodes: ParsedStyleNode[]): ParsedStyleNode[] {
  const groupedNodes: ParsedStyleNode[] = []
  for (const node of nodes) {
    const nodePath = node.conditionPath.map((condition) => condition.header)
    const address = JSON.stringify(nodePath)
    let insertionIndex = groupedNodes.length
    // 定义类 At Rule 的每次出现都是完整定义，不跨条目合并。
    const canMoveNode = !nodePath.some((header) => header.startsWith('@') && !/^@(layer|media|supports|container|scope)\b/.test(header))
    if (canMoveNode) {
      for (let index = groupedNodes.length - 1; index >= 0; index--) {
        const earlierNode = groupedNodes[index]
        const earlierPath = earlierNode.conditionPath.map((condition) => condition.header)
        if (JSON.stringify(earlierPath) === address) {
          insertionIndex = index + 1
          break
        }
        // 原生属性可能有简写关系；只有不同自定义属性可安全跨越。
        if (node.key === undefined || earlierNode.key === undefined || node.key === earlierNode.key
          || (!node.key.startsWith('--') && !earlierNode.key.startsWith('--'))
          || earlierPath.some((header) => header.startsWith('@') && !/^@(layer|media|supports|container|scope)\b/.test(header))) break
      }
    }
    groupedNodes.splice(insertionIndex, 0, node)
  }
  return groupedNodes
}
