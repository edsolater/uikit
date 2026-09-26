/** Content Parser 在当前语义节点队列上的有限操作。 */
import type { CompositeConditionPath } from '../condition'
import type { CSSKey } from '../css-key'
import { propertyName } from '../css-key'
import type { Valuable } from '../valuable'
import type { StyleNode } from './style-nodes'

/** 解析当前 Key 或 Content 时可读取的地址与队列操作。 */
export interface ASTController {
  parseWaveIndex: number
  conditionPath: CompositeConditionPath
  key: CSSKey | undefined
  content: unknown
  role: 'declaration-key' | 'declaration-content'
  activate(value: Valuable): void
  claimOnce(value: object): boolean
  findByKey(key: CSSKey, conditionPath?: CompositeConditionPath): StyleNode | undefined
  insert(conditionPath: CompositeConditionPath, key: CSSKey | undefined, content: unknown, position?: 'before' | 'after'): StyleNode
  remove(): void
  replaceResource(address: string): void
  insertResource(address: string, conditionPath: CompositeConditionPath, key: CSSKey | undefined, content: unknown): StyleNode
}

const maximumStyleNodeCount = 100_000

/** 为当前 Key 或 Content 位置创建不暴露底层队列的控制器。 */
export function createASTController(
  nodes: StyleNode[],
  parseWaveIndex: number,
  conditionPath: CompositeConditionPath,
  key: CSSKey | undefined,
  content: unknown,
  role: ASTController['role'],
  activate: (value: Valuable) => void,
  claimOnce: (value: object) => boolean,
  currentNode: StyleNode,
): ASTController {
  const currentPath = {
    targetConditionPath: [...conditionPath.targetConditionPath],
    stateConditionPath: [...conditionPath.stateConditionPath],
  }
  let beforeCurrentIndex = Math.max(0, nodes.indexOf(currentNode))
  let afterCurrentIndex = beforeCurrentIndex + 1

  /** 在当前节点前后按调用顺序插入内容。 */
  const insert = (path: CompositeConditionPath, nodeKey: CSSKey | undefined, nodeContent: unknown, position: 'before' | 'after' = 'before'): StyleNode => {
    if (nodes.length >= maximumStyleNodeCount) throw new Error(`AST 节点超过上限 ${maximumStyleNodeCount}，解析无法终止。`)
    const node: StyleNode = {
      conditionPath: {
        targetConditionPath: [...path.targetConditionPath],
        stateConditionPath: [...path.stateConditionPath],
      },
      key: nodeKey,
      content: nodeContent,
    }
    if (position === 'after') {
      afterCurrentIndex = Math.max(afterCurrentIndex, nodes.indexOf(currentNode) + 1)
      nodes.splice(afterCurrentIndex++, 0, node)
    } else {
      beforeCurrentIndex = Math.min(beforeCurrentIndex, nodes.indexOf(currentNode))
      nodes.splice(beforeCurrentIndex++, 0, node)
      afterCurrentIndex++
    }
    return node
  }

  return {
    parseWaveIndex,
    conditionPath: currentPath,
    key,
    content,
    role,
    activate,
    claimOnce,
    findByKey(nodeKey, path = currentPath) {
      const wantedName = propertyName(nodeKey)
      const target = path.targetConditionPath.map((item) => item.header)
      const states = path.stateConditionPath.map((state) => state.name)
      return nodes.find((node) => node.key !== undefined && propertyName(node.key) === wantedName
        && JSON.stringify(node.conditionPath.targetConditionPath.map((item) => item.header)) === JSON.stringify(target)
        && JSON.stringify(node.conditionPath.stateConditionPath.map((state) => state.name)) === JSON.stringify(states))
    },
    insert,
    remove() {
      const currentIndex = nodes.indexOf(currentNode)
      if (currentIndex === -1) return
      nodes.splice(currentIndex, 1)
      if (beforeCurrentIndex > currentIndex) beforeCurrentIndex--
      if (afterCurrentIndex > currentIndex) afterCurrentIndex--
    },
    replaceResource(address) {
      for (let index = nodes.length - 1; index >= 0; index--) {
        if (nodes[index].resourceAddress === address) nodes.splice(index, 1)
      }
    },
    insertResource(address, path, nodeKey, nodeContent) {
      const node = insert(path, nodeKey, nodeContent)
      node.resourceAddress = address
      return node
    },
  }
}
