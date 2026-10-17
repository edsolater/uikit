/** 自定义属性声明的基础与状态发布。
 *
 * 统一 Variable、普通 Key 与原始二元声明的材料、重访及产物归属。
 *
 * 状态绑定 CSS 名称与本次基础，不应由是否经过 Modify 入口决定。
 */
import { containKey, result } from '@edsolater/fnkit'
import type { ASTController } from '../compiler/ast-controller'
import type { JSSStyleNode } from '../compiler/rules-to-style-nodes'
import { conditionAddressKey, isSemanticPathPrefix, semanticPathParts, type ConditionPath } from '../condition'
import type { JSSCompileContext, JSSContent } from '../content'
import type { Declaration } from '../operations/declare'
import { keyPriority, propertyName, type JSSKey } from '../key'
import { appendStateCondition, type StateCondition } from '../pieces/state-conditions'
import { value, type Value, type ValueInput } from '../value'
import { isVariable, referenceVariable, type VariableDefaultValue, type VariableTarget, type VariableStateRule } from './core'
import { resolveVariable } from '../variable-cluster'

/** 一次实际声明或当地投影的基础和状态；消费者只引用这份材料。 */
export interface VariableDefinition {
  node: JSSStyleNode
  path: ConditionPath
  variable?: VariableTarget
  baseContent: ValueInput
  baseKey: JSSKey
  baseName?: string
  baseNode?: JSSStyleNode
  stateProducts: Map<string, { material: VariableTarget; rule: VariableStateRule; node: JSSStyleNode }>
  consumers?: Set<JSSStyleNode>
  onConsume?: (node: JSSStyleNode, active: boolean) => void
}
interface VariableDeclaration extends JSSContent {
  kind: 'variable-declaration'
  variable: VariableTarget
  content: VariableDefaultValue
}
const definitions = new WeakMap<JSSStyleNode, { input: unknown; key: unknown; revision: number; value: VariableDefinition }>()
const bindings = new WeakMap<JSSStyleNode, Map<VariableTarget, VariableDefinition>>()
export const variableProductRoles = new WeakMap<JSSStyleNode, 'default' | 'base' | 'state' | 'linked' | 'control' | 'result'>()
/**
 * 同级覆盖材料保留最后有效内容，普通 Key 的 join 仍由原键负责。
 */
export const joinVariableValues = (values: Value[]): ValueInput => value(values, {
  toCSSString: (items, resolve) => items.map(resolve).findLast(output => output !== undefined),
})

/**
 * 识别显式 Variable 基础；普通同名 Key 不成为 Modify 的对象归属。
 */
export const declaredVariable = (node: JSSStyleNode): VariableTarget | undefined =>
  containKey(node.content, 'kind') && node.content.kind === 'variable-declaration' ? (node.content as VariableDeclaration).variable : undefined

/**
 * 最近同对象声明按语义距离、等级和书写顺序选择，名称仅用于缩小查询。
 */
export const findVariableDeclaration = (controller: ASTController, variable: VariableTarget, path: ConditionPath): JSSStyleNode | undefined =>
  controller.search({ key: variable.key }).filter(node => declaredVariable(node) === variable && isSemanticPathPrefix(node.conditionPath, path))
    .sort((left, right) => semanticPathParts(right.conditionPath).length - semanticPathParts(left.conditionPath).length
      || keyPriority(right.key) - keyPriority(left.key) || controller.nodes().indexOf(right) - controller.nodes().indexOf(left))[0]

/**
 * 读取已经形成的声明材料，不查询或生成修改链。
 */
export const variableDefinition = (node: JSSStyleNode): VariableDefinition | undefined => definitions.get(node)?.value

/**
 * 显式声明自身负责基础与状态，后到声明使受影响的消费者重新选择归属。
 */
export function declareVariable(variable: VariableTarget, content: VariableDefaultValue, priority = variable.key.priority): Declaration {
  variable = resolveVariable(variable)
  const declaration: VariableDeclaration = {
    kind: 'variable-declaration', variable, content, resourceIdentity: Symbol('variable-declaration'),
    /**
     * 发布本次基础及自身状态，并使改归当前声明的消费者重新进入普通编译波。
     */
    onCompile(context, controller) {
      syncVariableStates(ensureDefinition(context.node, controller), [], controller)
      for (const node of controller.nodes()) if (declaredVariable(node) === variable) for (const consumer of variableDefinition(node)?.consumers ?? [])
        if (node !== context.node && findVariableDeclaration(controller, variable, consumer.conditionPath) === context.node) consumer.compileRevision++
    },
  }
  return [{ ...referenceVariable(variable), priority }, declaration]
}

/**
 * 消费记录归实际声明；存在修改时由该声明已安装的消费处理发布结果。
 */
export function consumeDeclaration(context: JSSCompileContext, controller: ASTController, variable: VariableTarget): VariableDefinition | undefined {
  const node = findVariableDeclaration(controller, variable, context.conditionPath)
  if (!node) return undefined
  const definition = ensureDefinition(node, controller)
  let current = bindings.get(context.node)
  if (!current) bindings.set(context.node, current = new Map())
  const previous = current.get(variable)
  if (previous !== definition) {
    previous?.consumers?.delete(context.node)
    previous?.onConsume?.(context.node, false)
    current.set(variable, definition)
  }
  const consumers = definition.consumers ??= new Set()
  if (!consumers.has(context.node)) {
    consumers.add(context.node)
    controller.onRemove(context.node, () => {
      if (current.get(variable) === definition) { consumers.delete(context.node); definition.onConsume?.(context.node, false); current.delete(variable) }
    })
  }
  definition.onConsume?.(context.node, true)
  return definition
}

/**
 * 声明输入重访精确撤旧；普通 Key 保留原基础节点与 join，不伪造 Variable。
 */
function ensureDefinition(node: JSSStyleNode, controller: ASTController): VariableDefinition {
  const previous = definitions.get(node)
  if (previous && previous.input === node.content && previous.key === node.key && previous.revision === node.compileRevision) return previous.value
  if (previous) {
    const old = previous.value
    if (old.baseNode !== node && old.baseNode) controller.remove(old.baseNode)
    for (const product of old.stateProducts.values()) controller.remove(product.node)
    for (const consumer of old.consumers ?? []) if (consumer !== node) consumer.compileRevision++
  }
  const variable = declaredVariable(node)
  const target = variable ?? (isVariable(node.key) ? resolveVariable(node.key) : undefined)
  const definition: VariableDefinition = { node, path: node.conditionPath, variable: target,
    baseContent: result(variable ? (node.content as VariableDeclaration).content : node.content as ValueInput),
    baseName: propertyName(node.key!).slice(2),
    baseKey: variable ? { toCSSString: () => `--${definition.baseName}`, priority: keyPriority(node.key), join: joinVariableValues } : node.key!,
    stateProducts: new Map(),
  }
  definitions.set(node, { input: node.content, key: node.key, revision: node.compileRevision, value: definition })
  if (variable) publishVariableBase(definition, controller)
  else definition.baseNode = node
  if (!previous) controller.onRemove(node, () => {
    for (const consumer of variableDefinition(node)?.consumers ?? []) consumer.compileRevision++
  })
  return definition
}

/**
 * 按当前 CSS 名称为所有真实声明同步状态，生成物和聚合结果不再次充当新声明。
 */
export function syncDeclarations(controller: ASTController, active: Map<string, Set<VariableTarget>>): boolean {
  let changed = false
  for (const node of controller.nodes()) {
    if (!node.key || node.aggregate || variableProductRoles.has(node) && !declaredVariable(node) || !propertyName(node.key).startsWith('--') || node.content === undefined) continue
    if (syncVariableStates(ensureDefinition(node, controller), active.get(propertyName(node.key)) ?? [], controller)) changed = true
  }
  return changed
}

/**
 * 发布基础时只选择本地址已命中规则，其他状态由统一状态发布处理。
 */
export function publishVariableBase(definition: VariableDefinition, controller: ASTController, anchor = definition.node): JSSStyleNode {
  const state = currentVariableState(definition.variable?.states, definition.path)
  const content = state ? result(definition.variable!.states!.get(state)!, definition.baseContent) : definition.baseContent
  const node = definition.baseNode = controller.insert({ before: anchor, conditionPath: definition.path }, [definition.baseKey, content],
    { owner: definition.node, productTag: definition })
  variableProductRoles.set(node, state ? 'state' : 'base')
  return node
}

/**
 * 每个声明地址只保留一份有效规则；自身状态覆盖借用规则，原 Key.join 不被模板重复调用。
 */
export function syncVariableStates(definition: VariableDefinition, materials: Iterable<VariableTarget>, controller: ASTController): boolean {
  // 先收集借用规则，最后处理自身规则，使同地址的自身规则保留覆盖权。
  const orderedMaterials = new Set(materials)
  // 本地址已有独立声明的材料由自己的声明键发布状态，不能借另一 Key 的等级再次贡献。
  for (const node of controller.nodes()) {
    const declared = declaredVariable(node)
    if (declared && conditionAddressKey(node.conditionPath) === conditionAddressKey(definition.path)) orderedMaterials.delete(declared)
  }
  if (definition.variable) {
    orderedMaterials.delete(definition.variable)
    orderedMaterials.add(definition.variable)
  }

  const desired = new Map<string, { material: VariableTarget; rule: VariableStateRule; path: ConditionPath }>()
  for (const material of orderedMaterials) {
    const current = currentVariableState(material.states, definition.path)
    for (const [state, rule] of material.states ?? []) {
      if (current && state.order <= current.order) {
        if (state !== current) continue
        // 借用规则不改写当前明确值；自身当前状态已有基础声明时不重复发布。
        if (material !== definition.variable || definition.baseNode) continue
      }
      const path = state === current ? definition.path : appendStateCondition(definition.path, state)
      desired.set(conditionAddressKey(path), { material, rule, path })
    }
  }

  // 撤销已经退出或被替换的规则，保留未变化的产物。
  let changed = false
  for (const [address, product] of definition.stateProducts) {
    const wanted = desired.get(address)
    if (wanted?.material === product.material && wanted.rule === product.rule) continue
    controller.remove(product.node)
    definition.stateProducts.delete(address)
    changed = true
  }

  // 原始声明的状态依次放在其后；生成基础值的声明仍以原声明节点为发布锚点。
  let anchor = definition.baseNode === definition.node ? definition.node : undefined
  for (const [address, input] of desired) {
    const previous = definition.stateProducts.get(address)
    if (previous) {
      if (anchor) anchor = previous.node
      continue
    }
    const position = anchor ? { after: anchor } : { before: definition.node }
    const node = controller.insert(
      { ...position, conditionPath: input.path },
      [definition.baseKey, result(input.rule, definition.baseContent)],
      { owner: definition.node, productTag: definition },
    )
    if (anchor) anchor = node
    variableProductRoles.set(node, 'state')
    definition.stateProducts.set(address, { ...input, node })
    changed = true
  }
  return changed
}

/**
 * 仅选择本地址最高已命中状态，不构造未消费配方。
 */
function currentVariableState(states: VariableTarget['states'], path: ConditionPath) {
  return [...states?.keys() ?? []].findLast(state => path.stateConditionPath.some(item => item.name === state.name))
}
