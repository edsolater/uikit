/** Content Parser 在当前语义节点队列上的有限操作。 */
import type { CompositeConditionPath } from '../condition'
import type { CSSKey } from '../css-key'
import { propertyName } from '../css-key'
import { isVariable } from '../variable'
import type { ValueInput } from '../value'
import type { Valuable } from '../valuable'
import type { StyleNode } from './style-nodes'

/** 解析 Content 时可以取得的队列操作。 */
export interface ASTController {
  parseWaveIndex: number
  conditionPath: CompositeConditionPath
  key: CSSKey | undefined
  role: 'declaration-key' | 'declaration-content'
  isVariableDefinition: boolean
  activate(value: Valuable): void
  claimOnce(value: object): boolean
  findByKey(key: CSSKey): StyleNode | undefined
  insert(conditionPath: CompositeConditionPath, key: CSSKey | undefined, content: ValueInput): StyleNode
  insertVariableDefinition(conditionPath: CompositeConditionPath, key: CSSKey | undefined, content: ValueInput): StyleNode
  replaceResource(address: string): void
  insertResource(address: string, conditionPath: CompositeConditionPath, key: CSSKey | undefined, content: ValueInput): StyleNode
}

const maximumStyleNodeCount = 100_000

/** 为当前 Content 位置创建不暴露底层队列的控制器。 */
export function createASTController(
  nodes: StyleNode[],
  parseWaveIndex: number,
  conditionPath: CompositeConditionPath,
  key: CSSKey | undefined,
  role: ASTController['role'],
  isVariableDefinition: boolean,
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
  const insert = (path: CompositeConditionPath, nodeKey: CSSKey | undefined, content: ValueInput, generatedVariableDefinition: boolean): StyleNode => {
    const variableAddress = generatedVariableDefinition && isVariable(nodeKey)
      ? JSON.stringify([path.targetConditionPath.map((item) => item.header), nodeKey.name]) : undefined
    if (generatedVariableDefinition) {
      const existing = nodes.find((node) => node.generatedVariableDefinition && node.variableAddress === variableAddress
        && node.key === nodeKey
        && JSON.stringify(node.conditionPath.targetConditionPath.map((item) => item.header))
          === JSON.stringify(path.targetConditionPath.map((item) => item.header))
        && JSON.stringify(node.conditionPath.stateConditionPath.map((state) => state.name))
          === JSON.stringify(path.stateConditionPath.map((state) => state.name)))
      if (existing) return existing
    }
    if (nodes.length >= maximumStyleNodeCount) throw new Error(`AST 节点超过上限 ${maximumStyleNodeCount}，解析无法终止。`)
    const node: StyleNode = {
      conditionPath: {
        targetConditionPath: [...path.targetConditionPath],
        stateConditionPath: [...path.stateConditionPath],
      },
      key: nodeKey,
      content,
      generatedVariableDefinition,
      dependencyAddress: currentNode.dependencyAddress,
      variableAddress,
      variableStateOrders: generatedVariableDefinition
        ? path.stateConditionPath.map((state) => state.order) : undefined,
    }
    if (generatedVariableDefinition && path.stateConditionPath.length) {
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
    role,
    isVariableDefinition,
    activate,
    claimOnce,
    findByKey(nodeKey) {
      const wantedName = propertyName(nodeKey)
      const target = currentPath.targetConditionPath.map((item) => item.header)
      const states = currentPath.stateConditionPath.map((item) => item.name)
      return nodes.find((node) => node.key !== undefined && propertyName(node.key) === wantedName
        && JSON.stringify(node.conditionPath.targetConditionPath.map((item) => item.header)) === JSON.stringify(target)
        && JSON.stringify(node.conditionPath.stateConditionPath.map((item) => item.name)) === JSON.stringify(states))
    },
    insert(path, nodeKey, content) { return insert(path, nodeKey, content, false) },
    insertVariableDefinition(path, nodeKey, content) { return insert(path, nodeKey, content, true) },
    replaceResource(address) {
      for (let index = nodes.length - 1; index >= 0; index--) {
        if (nodes[index].resourceAddress === address) nodes.splice(index, 1)
      }
    },
    insertResource(address, path, nodeKey, content) {
      const node = insert(path, nodeKey, content, false)
      node.resourceAddress = address
      return node
    },
  }
}
