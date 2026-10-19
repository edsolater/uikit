/** 自定义属性声明的基础与状态发布。
 *
 * 统一 Variable、普通 Key 与原始二元声明的材料、重访及产物归属。
 *
 * 状态绑定 CSS 名称与本次基础，不应由是否经过 Modify 入口决定。
 */
import { mapGet, result } from '@edsolater/fnkit'
import type { ASTController, ContentCompilationRecord } from '../compiler/ast-controller'
import type { JSSStyleNode } from '../compiler/rules-to-style-nodes'
import { conditionAddressKey, semanticPathParts, type ConditionPath } from '../condition'
import { isJSSContent, type JSSCompileContext, type JSSContent } from '../content'
import type { Declaration } from '../operations/declare'
import { keyPriority, propertyName, type JSSKey } from '../key'
import { appendStateCondition, type StateCondition } from '../pieces/state-conditions'
import { value, type Value, type ValueInput } from '../value'
import { isVariable, referenceVariable, type VariableDefaultValue, type VariableTarget, type VariableStateRule } from './core'

/** 一次实际声明或当地投影的基础和状态；消费者只引用这份材料。 */
export interface VariableDefinition {
  node: JSSStyleNode
  path: ConditionPath
  variable?: VariableTarget
  sourceNode?: JSSStyleNode
  /** 基础的真实声明或消费来源；生成投影沿用它，重建时核对其位置记录。 */
  originNode: JSSStyleNode
  sourceCompilation?: ContentCompilationRecord
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
  originNode?: JSSStyleNode
}
const definitions = new WeakMap<JSSStyleNode, { input: unknown; key: unknown; revision: number; value: VariableDefinition }>()
const bindings = new WeakMap<JSSStyleNode, Map<VariableTarget, VariableDefinition>>()
export const variableProductRoles = new WeakMap<JSSStyleNode, 'default' | 'base' | 'state' | 'linked' | 'control' | 'result'>()

/** 本次AST的声明位置索引；只保存现有节点引用，输入与覆盖仍由原声明拥有。 */
interface DeclarationRegistry {
  /** 原始业务声明；自动产物不扩大当前定义查询的候选范围。 */
  byVariable: Map<VariableTarget, Set<JSSStyleNode>>
  /** 实际基础与状态位置，供当地输入联动；与原始定义分开查询。 */
  sources: Map<VariableTarget, Set<JSSStyleNode>>
  /** 当前有效根声明，供默认保障按CSS名称核对。 */
  roots: Set<JSSStyleNode>
  /** 新增或改写后需要同步自身状态的声明位置。 */
  pending: Set<JSSStyleNode>
  /** 同时交付退出的根名称，防止改名或移出根后漏掉原名称的默认保障。 */
  observe: Set<(node: JSSStyleNode, previous?: VariableTarget, current?: VariableTarget, previousRoot?: string) => void>
  update: (node: JSSStyleNode, present: boolean) => void
}
const registries = new WeakMap<ASTController, DeclarationRegistry>()

/**
 * 接回AST初始登记与后续节点变化；查询只访问所属Variable，根清单与待同步声明随变化更新。
 */
export function declarationRegistry(controller: ASTController): DeclarationRegistry {
  let registry = registries.get(controller)
  if (!registry) {
    const targets = new WeakMap<JSSStyleNode, VariableTarget>()
    const rootNames = new WeakMap<JSSStyleNode, string>()
    registry = { byVariable: new Map(), sources: new Map(), roots: new Set(), pending: new Set(), observe: new Set(),
      /**
       * 更新该位置的声明归属和待办，通知实际受体；不复制声明值或推断其他位置。
       */
      update(node, present) {
        const previous = targets.get(node)
        const previousRoot = rootNames.get(node)
        const current = present ? declaredVariable(node) ?? (isVariable(node.key) ? node.key : variableDefinition(node)?.variable) : undefined
        if (previous) {
          registry!.byVariable.get(previous)?.delete(node)
          registry!.sources.get(previous)?.delete(node)
        }
        if (current) {
          targets.set(node, current)
          const role = variableProductRoles.get(node)
          if (!node.aggregate && (declaredVariable(node) && role !== 'linked' || !role && node.key === current))
            mapGet(registry!.byVariable, current, () => new Set<JSSStyleNode>()).add(node)
          if (node.key && node.content !== undefined && !node.aggregate && (variableDefinition(node)?.baseNode === node || role === 'state'))
            mapGet(registry!.sources, current, () => new Set<JSSStyleNode>()).add(node)
        } else targets.delete(node)
        registry!.roots.delete(node)
        rootNames.delete(node)
        if (present && node.key && !node.aggregate && propertyName(node.key).startsWith('--')) {
          registry!.pending.add(node)
          if (!node.conditionPath.stateConditionPath.length && node.conditionPath.targetConditionPath.length === 1
            && [':root', ':where(:root)'].includes(node.conditionPath.targetConditionPath[0].header)) {
            registry!.roots.add(node)
            rootNames.set(node, propertyName(node.key))
          }
        } else registry!.pending.delete(node)
        for (const observe of registry!.observe) observe(node, previous, current, previousRoot)
      },
    }
    registries.set(controller, registry)
    controller.observeNodes(registry.update)
  }
  return registry
}
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
  (node.content as VariableDeclaration | undefined)?.kind === 'variable-declaration' ? (node.content as VariableDeclaration).variable : undefined

/**
 * 按结构父路径选最近同对象原始声明，同址按priority及书写顺序选择。
 * 联动产物只提供当地声明事实，不改变业务定义。
 */
export function findVariableDeclaration(controller: ASTController, variable: VariableTarget, path: ConditionPath): JSSStyleNode | undefined {
  const parts = semanticPathParts(path)
  let selected: JSSStyleNode | undefined
  let depth = -1
  let priority = -Infinity
  for (const node of declarationRegistry(controller).byVariable.get(variable) ?? []) {
    if (node.key === undefined) continue
    const parent = semanticPathParts(node.conditionPath)
    if (parent.length > parts.length || !parent.every((part, index) => part === parts[index])) continue
    const level = keyPriority(node.key)
    if (!selected || parent.length > depth || parent.length === depth && (level > priority || level === priority && controller.compareOrder(node, selected) > 0)) {
      selected = node
      depth = parent.length
      priority = level
    }
  }
  return selected
}

/**
 * 读取节点所属的声明材料；基础与状态产物在创建时沿用所属声明，不改变同对象归属选择。
 */
export const variableDefinition = (node: JSSStyleNode): VariableDefinition | undefined => definitions.get(node)?.value

/**
 * 创建独立变量声明；其自身成为基础来源，后到声明使消费者重新选择归属。
 */
export function declareVariable(variable: VariableTarget, content: VariableDefaultValue, priority = variable.key.priority): Declaration {
  return createVariableDeclaration(variable, content, priority)
}

/**
 * 创建基础与状态材料；内部联动交付原来源，独立声明以自身为来源。
 * baseKey沿用Modify现有的动态基础槽，不创建另一个Variable身份。
 */
export function createVariableDeclaration(variable: VariableTarget, content: VariableDefaultValue, priority: number | undefined, originNode?: JSSStyleNode, baseKey: JSSKey = variable.key): Declaration {
  const declaration: VariableDeclaration = {
    kind: 'variable-declaration', variable, content, originNode, resourceIdentity: Symbol('variable-declaration'),
    /**
     * 发布本次基础，状态与消费者归属由统一声明登记维护。
     */
    onCompile(context, controller) {
      ensureDefinition(context.node, controller)
    },
  }
  return [{ ...referenceVariable(variable), toCSSString: () => propertyName(baseKey), priority }, declaration]
}

/**
 * 消费记录归实际声明；存在修改时由该声明已安装的消费处理发布结果。
 */
export function consumeDeclaration(context: JSSCompileContext, controller: ASTController, variable: VariableTarget): VariableDefinition | undefined {
  const node = findVariableDeclaration(controller, variable, context.conditionPath)
  if (!node) return undefined
  const definition = ensureDefinition(node, controller)
  let current = bindings.get(context.node)
  if (!current) {
    bindings.set(context.node, current = new Map())
    controller.onRemove(context.node, () => {
      for (const definition of current!.values()) { definition.consumers?.delete(context.node); definition.onConsume?.(context.node, false) }
      current!.clear()
    })
  }
  const previous = current.get(variable)
  if (previous !== definition) {
    previous?.consumers?.delete(context.node)
    previous?.onConsume?.(context.node, false)
    current.set(variable, definition)
  }
  const consumers = definition.consumers ??= new Set()
  consumers.add(context.node)
  definition.onConsume?.(context.node, true)
  return definition
}

/**
 * 两种原始声明入口统一登记，当前Address命中的旧消费者重新选择归属；输入重访精确撤旧。
 * 普通Key保留原基础节点与join，不伪造Variable。
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
  const target = variable ?? (isVariable(node.key) ? node.key : undefined)
  const input = variable ? (node.content as VariableDeclaration).content : node.content as ValueInput
  const definition: VariableDefinition = { node, path: node.conditionPath, variable: target,
    baseContent: input, originNode: variable ? (node.content as VariableDeclaration).originNode ?? node : node,
    baseName: propertyName(node.key!).slice(2),
    baseKey: variable ? { toCSSString: () => `--${definition.baseName}`, priority: keyPriority(node.key), join: joinVariableValues } : node.key!,
    stateProducts: new Map(),
  }
  definitions.set(node, { input: node.content, key: node.key, revision: node.compileRevision, value: definition })
  const registry = declarationRegistry(controller)
  // 两种原始声明入口共同使旧消费者重选；基础和状态映射可能属于同一份材料，只核对一次。
  if (target && variableProductRoles.get(node) !== 'linked') for (const old of new Set([...registry.byVariable.get(target) ?? []].map(variableDefinition))) if (old && old.node !== node && old.variable === target)
    for (const consumer of old.consumers ?? []) if (findVariableDeclaration(controller, target, consumer.conditionPath) === node) consumer.compileRevision++
  if (variable) publishVariableBase(definition, controller)
  else definition.baseNode = node
  registry.update(node, true)
  if (!previous) controller.onRemove(node, () => {
    for (const consumer of variableDefinition(node)?.consumers ?? []) consumer.compileRevision++
  })
  return definition
}

/**
 * 只为新增或改写的真实声明同步状态，生成物和聚合结果不再次充当新声明。
 */
export function syncDeclarations(controller: ASTController): boolean {
  let changed = false
  const pending = declarationRegistry(controller).pending
  for (const node of [...pending]) {
    pending.delete(node)
    if (!node.key || node.aggregate || variableProductRoles.has(node) && !declaredVariable(node) || !propertyName(node.key).startsWith('--') || node.content === undefined) continue
    if (syncVariableStates(ensureDefinition(node, controller), controller)) changed = true
  }
  return changed
}

/**
 * 发布基础内容；自动投影读取原消费位置，状态统一在基础完成后发布。
 */
export function publishVariableBase(definition: VariableDefinition, controller: ASTController, anchor = definition.node, role: 'base' | 'default' = 'base'): JSSStyleNode {
  const content = definition.sourceNode ? controller.getCompiledValue(definition.sourceNode, definition.baseContent) : definition.baseContent
  return controller.insert({ before: anchor, conditionPath: definition.path }, [definition.baseKey, content],
    { owner: definition.node, productTag: definition, initialize(node) {
      definition.baseNode = node
      definitions.set(node, { input: node.content, key: node.key, revision: node.compileRevision, value: definition })
      variableProductRoles.set(node, role)
    } })
}

/**
 * 每个声明地址只保留一份有效规则；仅展开所属对象状态，原 Key.join 不被模板重复调用。
 */
export function syncVariableStates(definition: VariableDefinition, controller: ASTController): boolean {
  const desired = new Map<string, { material: VariableTarget; rule: VariableStateRule; path: ConditionPath }>()
  const material = definition.variable
  if (material) {
    const current = currentVariableState(material.states, definition.path)
    for (const [state, rule] of material.states ?? []) {
      if (current && state.order <= current.order) {
        if (state !== current) continue
        // 自身当前状态已有基础声明时不重复发布。
        if (definition.baseNode && !declaredVariable(definition.node) && !definition.sourceNode) continue
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
      [definition.baseKey, resolveStateContent(input.rule, definition, controller)],
      { owner: definition.node, productTag: definition, initialize(node) {
        definitions.set(node, { input: node.content, key: node.key, revision: node.compileRevision, value: definition })
        variableProductRoles.set(node, 'state')
        definition.stateProducts.set(address, { ...input, node })
      } },
    )
    if (anchor) anchor = node
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

/**
 * 状态回调接收本次声明基础；可调用内容对象仍保留内容协议。
 */
function resolveStateContent(rule: VariableStateRule, definition: VariableDefinition, controller: ASTController): ValueInput {
  let base = definition.baseContent
  const source = definition.sourceNode ?? definition.baseNode ?? definition.node
  const seen = new Set<unknown>()
  while (!seen.has(base)) {
    seen.add(base)
    const compiled = controller.getCompiledContent(source, base) as ValueInput
    if (compiled === base) break
    base = compiled
  }
  return isJSSContent(rule) ? rule : result(rule, base)
}
