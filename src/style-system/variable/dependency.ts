/** 本次AST的根基础保障、目标状态与当地依赖联动。
 *
 * 默认按根声明名称补齐，当前配方按样式Address选取；来源存活由AST管理。
 *
 * 当地输入声明才触发基础联动，纯消费继承已有结果，自身状态仍独立发布。
 */
import { isObjectLike, mapGet } from '@edsolater/fnkit'
import { condition, conditionAddressKey, type ConditionPath, type StateConditionPath } from '../condition'
import { type JSSCompileContext } from '../content'
import { keyPriority, propertyName, type JSSKey, type JSSKeyObject } from '../key'
import { referencedVariable, type VariableTarget, type VariableStateRule } from './core'
import { createVariableDeclaration, declarationRegistry, findVariableDeclaration, publishVariableBase, syncVariableStates, syncDeclarations, variableDefinition,
  variableProductRoles, type VariableDefinition } from './declare'
import type { ASTController, ContentCompilationRecord } from '../compiler/ast-controller'
import type { JSSStyleNode } from '../compiler/rules-to-style-nodes'
import { appendStateCondition } from '../pieces/state-conditions'
import type { ValueInput } from '../value'

/** 一份配方的展开位置、状态条件和真实基础来源。 */
interface Recipe {
  content: ValueInput
  /** 配方实际编译的位置；状态边读取具体状态产物的展开记录。 */
  sourceNode: JSSStyleNode
  states?: StateConditionPath
  /** 状态边的真实基础来源；可为声明或原生消费，投影重建不自激。 */
  originNode: JSSStyleNode
  /** 原始状态规则的身份变化也会使联动失效。 */
  rule?: VariableStateRule
}
/** 所选基础与原消费快照；失效时退出对象索引。 */
interface Consumption extends Recipe {
  native: boolean
  revision: number
  keyInput: JSSKey | undefined
  contentInput: unknown
}
/** 一个材料的消费者及各完整地址上的自动声明。 */
interface Usage {
  /** 多个实际消费共同分析时，保留首次登记的选择顺序。 */
  order: number
  /** 当前实际输入，用于改变配方时定向退出旧观察边。 */
  references: Set<VariableTarget>
  /** 与来源账本共享产物对象，按实际输入和状态直接找到续链位置。 */
  links: Map<VariableTarget, Map<string, Set<LinkedDeclaration>>>
  defaultKey: JSSKeyObject
  consumers: Map<JSSStyleNode, Consumption>
  defaults: Map<string, { definition: VariableDefinition; kind: 'root' | 'states' }>
}
/** 自动发布的期望输入；先撤销失效产物，再建立缺少的根基础或目标状态。 */
interface DefinitionRequest {
  path: ConditionPath
  sourceNode?: JSSStyleNode
  originNode: JSSStyleNode
  content: ValueInput
  owners: JSSStyleNode[]
  key: JSSKey
  kind: 'root' | 'states'
}
/** 一份条件联动声明及其真实基础来源；实际状态产物不另建失效源。 */
interface LinkedDeclaration {
  node: JSSStyleNode
  content: ValueInput
  originNode: JSSStyleNode
  originCompilation?: ContentCompilationRecord
  rule?: VariableStateRule
}
/** 对象索引直接带当前配方，默认与联动不另存公共声明归属。 */
interface DependencySession {
  usages: Map<VariableTarget, Usage>
  observers: Map<VariableTarget, Map<VariableTarget, Map<string, Recipe>>>
  links: Map<JSSStyleNode, Map<VariableTarget, Map<string, LinkedDeclaration>>>
  /** 消费表达式需要更新的对象；不因输入数值改变而重算业务值。 */
  pending: Set<VariableTarget>
  /** 根保障及消费处自身状态需要核对的对象。 */
  defaults: Set<VariableTarget>
  /** 声明或受体改变后需要核对当地联动的实际输入位置。 */
  sources: Set<JSSStyleNode>
  /** 从改变的消费节点直接退出旧关系，不遍历其他消费者。 */
  consumers: WeakMap<JSSStyleNode, Set<VariableTarget>>
}
const sessions = new WeakMap<object, DependencySession>()
const rootAddress = conditionAddressKey({ targetConditionPath: [condition(':root')], stateConditionPath: [] })

/**
 * 记录实际访问的配方；只有原生 CSS 属性激活依赖，描述符和独立声明不激活。
 */
export function observeVariable(target: VariableTarget, content: ValueInput, context: JSSCompileContext, controller: ASTController, sourceNode = context.node, originNode = variableDefinition(context.node)?.originNode ?? sourceNode): void {
  const session = sessionOf(context, controller)
  if (context.role === 'declaration-key') return
  const usage = mapGet(session.usages, target, (): Usage => ({ order: session.usages.size, references: new Set(), links: new Map(), consumers: new Map(), defaults: new Map(),
    defaultKey: { ...target.key, priority: keyPriority(target.key) - 1 },
  }))
  const native = context.role === 'declaration-content' && context.key !== undefined
    && !propertyName(context.key).startsWith('--')
    && !context.conditionPath.targetConditionPath.some(item => /^@(property|function|font-face)\b/.test(item.header))
  usage.consumers.set(context.node, { content, sourceNode, originNode, native, revision: context.node.compileRevision,
    keyInput: context.node.key, contentInput: context.node.content })
  let targets = session.consumers.get(context.node)
  if (!targets) {
    session.consumers.set(context.node, targets = new Set())
    // 清理属于节点生命周期，重访只替换当前消费关系，不重复登记回调。
    controller.onRemove(context.node, () => {
      for (const target of targets!) { session.usages.get(target)!.consumers.delete(context.node); session.pending.add(target) }
    })
  }
  targets.add(target)
  session.defaults.add(target)
  if (native) session.pending.add(target)
  const owner = variableDefinition(context.node)?.variable
  if (owner) session.pending.add(owner)
}

/**
 * 连接本次声明变化与依赖工作，统一安排消费更新、默认/自身状态及输入联动。
 * 每个会话只登记一份收敛检查，待办由实际节点与引用变化提供。
 */
function sessionOf(context: JSSCompileContext, controller: ASTController): DependencySession {
  let session = sessions.get(context.session)
  if (!session) {
    sessions.set(context.session, session = { usages: new Map(), observers: new Map(), links: new Map(), pending: new Set(), defaults: new Set(), sources: new Set(), consumers: new WeakMap() })
    const registry = declarationRegistry(controller)
    registry.observe.add((node, previous, current, previousRoot) => {
      for (const target of session!.consumers.get(node) ?? []) {
        const usage = session!.usages.get(target)!
        const input = usage.consumers.get(node)
        if (input && (input.revision !== node.compileRevision || input.keyInput !== node.key || input.contentInput !== node.content)) {
          usage.consumers.delete(node)
          session!.consumers.get(node)!.delete(target)
          session!.pending.add(target)
          session!.defaults.add(target)
        }
      }
      if (previous) session!.defaults.add(previous)
      if (current) session!.defaults.add(current)
      if (current && registry.sources.get(current)?.has(node)) session!.sources.add(node)
      else session!.sources.delete(node)
      for (const target of [previous, current]) for (const reference of target ? session!.usages.get(target)?.references ?? [] : [])
        for (const source of registry.sources.get(reference) ?? []) session!.sources.add(source)
      const currentRoot = registry.roots.has(node) && node.key ? propertyName(node.key) : undefined
      if (previousRoot || currentRoot) {
        for (const target of session!.usages.keys()) {
          const name = propertyName(target.key)
          if (name === previousRoot || name === currentRoot) session!.defaults.add(target)
        }
      }
    })
    controller.addSettlementCheck(() => settleDeclarations(session!, controller))
  }
  return session
}

/**
 * 只读已求得内容的结构化依赖，不再执行生产函数，也不把状态归属当图边。
 */
function collectReferencedVariables(content: unknown, node: JSSStyleNode, controller: ASTController, seen = new Set<object>()): VariableTarget[] {
  if (!isObjectLike(content) || seen.has(content)) return []
  const reference = referencedVariable(content)
  if (reference) return [reference]
  seen.add(content)
  const compiled = controller.getCompiledContent(node, content)
  if (compiled !== content) return collectReferencedVariables(compiled, node, controller, seen)
  return (controller.getContentCompilation(node, content)?.dependencies ?? []).flatMap(item => collectReferencedVariables(item, node, controller, seen))
}

/**
 * 只推进变更对象所连接的实际消费；没有新的声明或消费事实时结束，不重访无关材料。
 */
function settleDeclarations(session: DependencySession, controller: ASTController): boolean {
  const active = new Set(session.pending)
  session.pending.clear()
  for (const target of active) {
    for (const dependent of session.observers.get(target)?.keys() ?? []) active.add(dependent)
  }
  for (const target of active) {
    const references = session.usages.get(target)?.references
    for (const reference of references ?? []) {
      for (const source of declarationRegistry(controller).sources.get(reference) ?? []) session.sources.add(source)
      session.observers.get(reference)?.delete(target)
    }
    references?.clear()
  }
  const pending: [VariableTarget, Recipe, JSSStyleNode][] = []
  const usages = [...active].sort((left, right) => (session.usages.get(left)?.order ?? 0) - (session.usages.get(right)?.order ?? 0))
  for (const target of usages) for (const [node, input] of session.usages.get(target)?.consumers ?? []) {
    if (!input.native) continue
    pending.push([target, input, node])
  }
  // 基础与状态沿同一条实际消费链扩展；只查具体编译位置，不激活其他地址的声明。
  const visited = new Set<Recipe>()
  const stateNodes = new Set<JSSStyleNode>()
  for (const [target, input, consumer] of pending) {
    if (visited.has(input)) continue
    visited.add(input)
    // 只有基础消费发现自身状态；已展开状态只读取实际引用，不能再展开同对象的其他状态。
    if (!input.states) {
      const declaration = variableDefinition(input.sourceNode)
      const local = session.usages.get(target)?.defaults.get(conditionAddressKey(consumer.conditionPath))
      for (const definition of [declaration?.variable === target ? declaration : undefined, local?.kind === 'states' ? local.definition : undefined]) if (definition)
        for (const product of definition.stateProducts.values()) if (product.material === target && !stateNodes.has(product.node)) {
          stateNodes.add(product.node)
          pending.push([target, { content: definition.baseContent, sourceNode: product.node,
            states: product.node.conditionPath.stateConditionPath, originNode: definition.originNode, rule: product.rule }, product.node])
        }
    }
    const content = input.states ? input.sourceNode.content : input.content
    const address = input.states?.length ? JSON.stringify(input.states.map(state => state.name)) : '[]'
    for (const reference of observeRecipe(session, target, input, content, controller, address)) {
      // 已有状态联动可在当地展开出新引用；只继续本次同址状态产物，不重新展开整套状态。
      for (const linked of input.states ? session.usages.get(target)?.links.get(reference)?.get(address) ?? [] : []) {
        // links的onRemove同步退出贡献；只退出输出的节点仍可拥有有效依赖，不能用输出队列代替存活。
        if (linked.originNode !== input.originNode || linked.rule !== input.rule
          || linked.originCompilation !== controller.getContentCompilation(linked.originNode, linked.originNode.content)) continue
        const linkedAddress = conditionAddressKey(linked.node.conditionPath)
        for (const product of variableDefinition(linked.node)?.stateProducts.values() ?? [])
          if (conditionAddressKey(product.node.conditionPath) === linkedAddress && !stateNodes.has(product.node)) {
            stateNodes.add(product.node)
            pending.push([target, { content: linked.content, sourceNode: product.node, states: product.node.conditionPath.stateConditionPath,
              originNode: linked.originNode, rule: product.rule }, product.node])
          }
      }
      const next = session.usages.get(reference)?.consumers.get(input.sourceNode)
      if (next) pending.push([reference, next, input.sourceNode])
    }
  }
  // 待核对的输入来源跨波保留；发布基础或状态不能丢掉尚未处理的联动，也不用重做整条消费分析。
  for (const target of active) session.defaults.add(target)
  const defaults = new Set(session.defaults)
  session.defaults.clear()
  const defaultsChanged = settleDefaults(session, controller, defaults)
  const declarationsChanged = syncDeclarations(controller)
  const changed = settleLinks(session, controller, session.sources)
  return changed || defaultsChanged || declarationsChanged || session.pending.size > 0 || session.defaults.size > 0 || session.sources.size > 0
}

/**
 * 根清单按CSS名保障创建默认；消费处只安排自身状态，基础联动由当地输入声明触发。
 */
function settleDefaults(session: DependencySession, controller: ASTController, active: Set<VariableTarget>): boolean {
  let changed = false
  const requests = new Map<VariableTarget, Map<string, DefinitionRequest>>()
  const rootPath: ConditionPath = { targetConditionPath: [condition(':root')], stateConditionPath: [] }
  // 当前AST根清单只读一次；按CSS名保障默认，不能改成Variable对象身份检查。
  const rootDeclarations = [...declarationRegistry(controller).roots].filter(node => node.content !== undefined).map(node => ({ node, name: propertyName(node.key!) }))
  for (const target of active) {
    const usage = session.usages.get(target)
    if (!usage) continue
    const desired = new Map<string, DefinitionRequest>()
    // 两种根地址均为现役主题入口；只识别已约定的完整单层地址，不解析任意选择器。
    const name = propertyName(target.key)
    const roots = rootDeclarations.filter(item => item.name === name).map(item => item.node)
    const root = roots.find(node => variableProductRoles.get(node) !== 'default') ?? roots[0]
    const ownRoot = usage.defaults.get(rootAddress)?.definition.baseNode
    for (const [consumer, input] of usage.consumers) {
      if (!root || root === ownRoot) {
        mapGet(desired, rootAddress, (): DefinitionRequest => ({ path: rootPath,
          sourceNode: input.content === target.content ? input.sourceNode : undefined,
          originNode: input.originNode, content: target.content, owners: [], key: usage.defaultKey, kind: 'root' })).owners.push(consumer)
      } else {
        controller.depend(root, { owner: consumer })
      }
      if (variableProductRoles.get(consumer) === 'default') continue
      if (!target.states?.size) continue
      const declaration = findVariableDeclaration(controller, target, consumer.conditionPath)
      const local = declaration && variableDefinition(declaration)
      if (local && conditionAddressKey(local.path) === conditionAddressKey(consumer.conditionPath)) continue
      mapGet(desired, conditionAddressKey(consumer.conditionPath), (): DefinitionRequest => ({ path: consumer.conditionPath, sourceNode: local?.baseNode ?? input.sourceNode, originNode: local?.originNode ?? input.originNode,
        content: local?.baseContent ?? input.content, owners: [], key: local?.baseKey ?? usage.defaultKey, kind: 'states' })).owners.push(consumer)
    }
    requests.set(target, desired)
  }
  for (const [target, desired] of requests) {
    const usage = session.usages.get(target)!
    for (const [address, record] of usage.defaults) {
      const wanted = desired.get(address)
      if (wanted && wanted.sourceNode === record.definition.sourceNode && wanted.originNode === record.definition.originNode && (!wanted.sourceNode || controller.getContentCompilation(wanted.sourceNode, wanted.sourceNode.content) === record.definition.sourceCompilation) && wanted.content === record.definition.baseContent && wanted.key === record.definition.baseKey && wanted.kind === record.kind
        && (!record.definition.baseNode || declarationRegistry(controller).roots.has(record.definition.baseNode))) continue
      if (record.definition.baseNode) controller.remove(record.definition.baseNode)
      for (const product of record.definition.stateProducts.values()) controller.remove(product.node)
      usage.defaults.delete(address); changed = true
    }
  }
  if (changed) return true
  for (const [target, desired] of requests) {
    const usage = session.usages.get(target)!
    for (const [address, request] of desired) {
      let record = usage.defaults.get(address)
      if (!record) {
        const owner = request.owners[0]
        const definition: VariableDefinition = { node: owner, path: request.path, variable: request.kind === 'root' ? undefined : target,
          baseContent: request.content, sourceNode: request.sourceNode, originNode: request.originNode, sourceCompilation: request.sourceNode && controller.getContentCompilation(request.sourceNode, request.sourceNode.content), baseKey: request.key, stateProducts: new Map() }
        if (request.kind !== 'states') {
          publishVariableBase(definition, controller, controller.firstNode(), 'default')
        }
        usage.defaults.set(address, record = { definition, kind: request.kind })
        changed = true
      }
      record.definition.node = request.owners[0]
      if (record.definition.baseNode) for (const owner of request.owners) controller.depend(record.definition.baseNode, { owner })
      if (record.kind !== 'root' && syncVariableStates(record.definition, controller)) changed = true
      for (const product of record.definition.stateProducts.values())
        for (const owner of request.owners) controller.depend(product.node, { owner })
    }
  }
  return changed
}

/**
 * 按实际展开位置登记配方对象边，并返回实际引用以继续消费链。
 * 状态边保留其条件，基础内容用于当地重新绑定。
 */
function observeRecipe(session: DependencySession, target: VariableTarget, input: Recipe, content: unknown, controller: ASTController, address: string): VariableTarget[] {
  const references = collectReferencedVariables(content, input.sourceNode, controller)
  const linkedSource = variableProductRoles.get(variableDefinition(input.sourceNode)?.node!) === 'linked'
  for (const name of references) {
    session.usages.get(target)?.references.add(name)
    for (const source of declarationRegistry(controller).sources.get(name) ?? []) session.sources.add(source)
    const recipes = mapGet(mapGet(session.observers, name, () => new Map()), target, () => new Map())
    // 自动产物中的实际消费只补新引用，不能反写已有原始配方入口，使同一条边在两个来源间反复撤建。
    if (!linkedSource || !recipes.has(address)) recipes.set(address, input)
  }
  return references
}

/**
 * 来源拥有联动产物；状态边只在合并后的状态地址发布，不泄漏为无条件基础。
 */
function settleLinks(session: DependencySession, controller: ASTController, active: Set<JSSStyleNode>): boolean {
  let changed = false
  const sources = declarationRegistry(controller).sources
  sourceLoop: for (const source of [...active].sort((left, right) => controller.compareOrder(left, right))) {
    active.delete(source)
    const definition = variableDefinition(source)
    // 前项撤销可能级联移除后项；实际输入清单统一判定位置仍然有效。
    if (!sources.get(definition?.variable!)?.has(source)) continue
    const targets = session.observers.get(definition?.variable!) ?? new Map<VariableTarget, Map<string, Recipe>>()
    let links = session.links.get(source)
    if (!links && targets.size) {
      session.links.set(source, links = new Map())
      controller.onRemove(source, () => session.links.delete(source))
    }
    for (const [target, products] of links ?? []) if (!targets.has(target)) {
      for (const product of products.values()) controller.remove(product.node)
      links!.delete(target); changed = true
    }
    if (!sources.get(definition?.variable!)?.has(source)) continue
    for (const [target, inputs] of targets) {
      if (target === variableDefinition(source)?.variable) continue
      const products = mapGet(links!, target, () => new Map())
      for (const [address, product] of products) if (!inputs.has(address)) {
        controller.remove(product.node); products.delete(address); changed = true
      }
      if (!sources.get(definition?.variable!)?.has(source)) continue sourceLoop
      for (const [address, input] of inputs) {
        const path = (input.states ?? []).reduce(appendStateCondition, source.conditionPath)
        // 原始定义按来源声明的Address重选，不能把另一消费者的创建默认投影到固定覆盖上。
        const declaration = findVariableDeclaration(controller, target, path)
        const definition = declaration && variableDefinition(declaration)
        const content = definition?.baseContent ?? input.content
        const sourceNode = definition?.baseNode ?? input.sourceNode
        const sourceVariable = variableDefinition(source)?.variable
        const references = input.states ? collectReferencedVariables(input.sourceNode.content, input.sourceNode, controller)
          : collectReferencedVariables(content, sourceNode, controller)
        const previous = products.get(address)
        if (!references.includes(sourceVariable!) || definition && conditionAddressKey(definition.path) === conditionAddressKey(path)) {
          if (previous) { controller.remove(previous.node); active.add(source); changed = true; continue sourceLoop }
          continue
        }
        const origin = definition?.originNode ?? input.originNode
        const sourceCompilation = controller.getContentCompilation(origin, origin.content)
        if (previous && previous.content === content && previous.originNode === origin && previous.originCompilation === sourceCompilation && previous.rule === input.rule) continue
        // 撤旧后只重访该输入，其他位置继续本轮；来源已退出则下轮由清单过滤。
        if (previous) { controller.remove(previous.node); active.add(source); changed = true; continue sourceLoop }
        const locations = mapGet(mapGet(session.usages.get(target)!.links, sourceVariable!, () => new Map()), address, () => new Set<LinkedDeclaration>())
        controller.insert({ after: source, conditionPath: path },
          createVariableDeclaration(target, content, keyPriority(target.key) - 1, origin, definition?.baseKey),
          { owner: source, productTag: target, initialize(node) {
            const linked = { node, content, originNode: origin, originCompilation: sourceCompilation, rule: input.rule }
            products.set(address, linked)
            locations.add(linked)
            variableProductRoles.set(node, 'linked')
            controller.onRemove(node, () => { products.delete(address); locations.delete(linked) })
          } })
        changed = true
      }
    }
  }
  return changed
}
