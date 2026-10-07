/** 局部 Variable 声明与相对修改的 CSS 生成器。

为每个局部声明生成基础值和状态值，再把归属它的修改接成最终 CSS 值。

样式节点增删后，修改仍须按当前归属与顺序从基础值继续计算。
*/
import { createJSSContent, type JSSCompileContext, type JSSContent } from './content'
import type { Expression } from './content'
import { resolveVariable } from './variable-cluster'
import { assert, containKey, isFunction, result } from '@edsolater/fnkit'
import { condition, conditionAddressKey, isSemanticPathPrefix, semanticPathParts, type ConditionPath } from './condition'
import type { Declaration } from './declaration'
import type { JSSStyleNode } from './compiler/rules-to-style-nodes'
import type { JSSKeyObject } from './key'
import type { ASTController } from './compiler/ast-controller'
import { value, type Value, type ValueInput } from './value'
import { appendStateCondition } from './pieces/state-conditions'
import { variableContent, variableRegistrationDeclarations, type Variable, type VariableDefaultValue } from './variable'
import { isModification, modificationRule, readJSValue, type Modification } from './modification'
import { applyColorModification } from './pieces/contents/functions/color-modification'

/** 一个局部声明的基础值、最终值和修改步骤；只在本次编译内有效。 */
interface VariableInstance {
  node: JSSStyleNode
  variable: Variable
  number: number
  count: number
  baseName: string
  baseKey: JSSKeyObject
  /** 同一 ID 的修改共用一步，作用范围限于此局部声明。 */
  steps: VariableStep[]
  results: Map<string, VariableResult>
}

/** 局部 Variable 同址赋值保留最后一个实际输出的值。 */
const joinVariableValues = (values: Value[]): ValueInput =>
  value(values, { toCSSString: (items, resolve) => {
    let latest: string | undefined
    for (const item of items) {
      const output = resolve(item)
      if (output !== undefined) latest = output
    }
    return latest
  } })

/** 一个消费地址的本地结果链；同址消费者共享，条件与继承交给 CSS。 */
interface VariableResult {
  path: ConditionPath
  members: Set<JSSStyleNode>
  alias?: JSSStyleNode
}
/** 一步修改的候选规则及 CSS 选择门；共享 ID 由原选择器层叠决定候选。 */
interface VariableStep {
  instance: VariableInstance
  name: string
  anchor: JSSStyleNode
  fallback: JSSStyleNode
  members: Map<JSSStyleNode, { gate: string; output: Expression; selection: JSSStyleNode }>
  currentExpression: Expression
  count: number
  id?: string | symbol
}
/** 局部声明显式携带目标与内容，不另建隐藏身份表。 */
interface VariableDeclaration extends JSSContent {
  kind: 'variable-declaration'
  variable: Variable
  content: VariableDefaultValue
}
/** 识别显式局部声明；其他内容不参与局部归属。 */
const isVariableDeclaration = (input: unknown): input is VariableDeclaration =>
  containKey(input, 'kind') && input.kind === 'variable-declaration'
const variableSessions = new WeakMap<object, VariableSession>()
/** 本次编译中，各声明和修改节点所属的局部实例与步骤。 */
interface VariableSession {
  instances: WeakMap<JSSStyleNode, VariableInstance>
  steps: WeakMap<JSSStyleNode, VariableStep>
  consumers: WeakMap<JSSStyleNode, Map<Variable, VariableInstance>>
  nextNumber: number
}
/** 取得本次编译的声明与修改状态；首次访问时建立，编译之间互不影响。 */
function sessionOf(context: JSSCompileContext): VariableSession {
  let session = variableSessions.get(context.session)
  if (!session) {
    session = { instances: new WeakMap(), steps: new WeakMap(), consumers: new WeakMap(), nextNumber: 0 }
    variableSessions.set(context.session, session)
  }
  return session
}
/** 识别局部声明所用的 Variable；其他样式节点返回 undefined。 */
const declaredVariable = (node: JSSStyleNode): Variable | undefined =>
  isVariableDeclaration(node.content) ? node.content.variable : undefined
/** 从当前 AST 取得语义父链上最近的同对象声明。 */
const nearestDeclaration = (controller: ASTController, variable: Variable, path: ConditionPath): JSSStyleNode | undefined =>
  controller.search({ key: variable.config.definitionKey })
    .filter(node => declaredVariable(node) === variable && isSemanticPathPrefix(node.conditionPath, path))
    .sort((left, right) => semanticPathParts(right.conditionPath).length - semanticPathParts(left.conditionPath).length)[0]

/** 找到状态内容应写入的局部基础值，返回其 Key；没有局部声明则返回 undefined。
 * 该局部实例尚未建立时，会同时生成基础值和状态值。
 */
export function findLocalBaseKey(
  context: JSSCompileContext,
  controller: ASTController,
  variable: Variable,
  path: ConditionPath,
): JSSKeyObject | undefined {
  const target = nearestDeclaration(controller, variable, path)
  return target ? ensureVariableInstance(context, controller, target).baseKey : undefined
}

/** 为 Variable 创建局部基础值声明；返回的声明在编译消费时生成基础值，并接管归属它的已有修改。 */
export function declareVariable(
  variable: Variable,
  value: VariableDefaultValue,
): Declaration {
  const content: VariableDeclaration = {
    kind: 'variable-declaration', variable, content: value,
    resourceIdentity: Symbol('variable-declaration'),
    onCompile(context, controller) {
      ensureVariableInstance(context, controller, context.node)
      // 新局部定义接管已有修改时，重新确定这些修改的归属。
      const session = sessionOf(context)
      for (const node of controller.nodes()) {
        const previous = session.steps.get(node)?.instance ?? session.consumers.get(node)?.get(variable)
        if (previous && previous !== session.instances.get(context.node) && nearestDeclaration(controller, variable, node.conditionPath) === context.node)
          node.compileRevision++
      }
    },
  }
  return [variable, content]
}

/** 为局部声明生成基础值及各状态值，并取得这次编译中的修改归属；同一语义路径重复声明会报错。 */
function ensureVariableInstance(context: JSSCompileContext, controller: ASTController, node: JSSStyleNode): VariableInstance {
  const session = sessionOf(context)
  const existing = session.instances.get(node)
  if (existing) return existing
  assert(isVariableDeclaration(node.content), '局部 Variable 实例需要 Variable 声明。')
  const { variable, content } = node.content
  const address = JSON.stringify(semanticPathParts(node.conditionPath))
  assert(
    !controller.search({ key: variable.config.definitionKey }).some(other => other !== node && declaredVariable(other) === variable && JSON.stringify(semanticPathParts(other.conditionPath)) === address),
    `Variable ${variable.name} 在同一语义路径重复定义。`,
  )
  const instance = createVariableInstance(session, node, variable)
  session.instances.set(node, instance)
  declareInstanceValues(controller, instance, content)
  takeOverAutomaticStates(controller, instance)
  controller.onRemove(node, () => {
    for (const consumer of controller.nodes())
      if (session.steps.get(consumer)?.instance === instance || session.consumers.get(consumer)?.get(variable) === instance)
        consumer.compileRevision++
  })
  return instance
}

/** 为本次局部声明分配实例编号、基础 Key 及共享步骤账本，不生成 AST 产物。 */
function createVariableInstance(session: VariableSession, node: JSSStyleNode, variable: Variable): VariableInstance {
  const instance: VariableInstance = {
    node,
    variable,
    number: ++session.nextNumber,
    count: 0,
    baseName: variable.name,
    baseKey: {
      toCSSString: () => `--${instance.baseName}`,
      join: joinVariableValues,
    },
    steps: [],
    results: new Map(),
  }
  return instance
}

/** 求基础生产函数并发布基础值与有序状态值。 */
function declareInstanceValues(controller: ASTController, instance: VariableInstance, content: VariableDefaultValue): void {
  const { node, variable } = instance
  const baseContent = variableContent(result(content))
  controller.insert(
    { before: node, conditionPath: node.conditionPath },
    [instance.baseKey, baseContent],
    { owner: node, identity: 'base' },
  )
  for (const [state, stateContent] of variable.config.states) {
    const stateNode = controller.insert(
      {
        before: node,
        conditionPath: appendStateCondition(node.conditionPath, state),
      },
      [instance.baseKey, variableContent(stateContent)],
      { owner: node, identity: `state/${state.name}` },
    )
    stateNode.readState = state.name
  }
}

/** 局部声明接管自动状态产物，每个节点按当前 AST 确认归属。 */
function takeOverAutomaticStates(controller: ASTController, instance: VariableInstance): void {
  const { node, variable } = instance
  for (const candidate of controller.search({ productTag: variable })) {
    if (
      candidate.resourceAddress === undefined && nearestDeclaration(controller, variable, candidate.conditionPath) === node
    ) {
      controller.remove(candidate)
    }
  }
}

/** 在普通引用地址求完整修改链，允许子元素覆盖规则 Variable 后当地应用。 */
export function consumeVariable(context: JSSCompileContext, controller: ASTController, variable: Variable): void {
  const target = nearestDeclaration(controller, variable, context.conditionPath)
  if (!target) return
  const instance = ensureVariableInstance(context, controller, target)
  const session = sessionOf(context)
  let consumers = session.consumers.get(context.node)
  if (!consumers) session.consumers.set(context.node, consumers = new Map())
  const previous = consumers.get(variable)
  if (previous === instance) return
  if (previous) releaseResult(controller, previous, context.node)
  consumers.set(variable, instance)
  publishResult(controller, instance, context.node)
  controller.onRemove(context.node, () => {
    if (consumers.get(variable) === instance) { consumers.delete(variable); releaseResult(controller, instance, context.node) }
  })
}

/**
 * 将独立规则应用到最近的同对象声明，规则可由普通 Variable 保存，条件由 CSS 决定。
 * 相同 id 在同一局部声明内共用一步；未指定 id 时每次调用形成独立步骤。
 * @example
 * rules('.button', [declare(surfaceColor, baseColor)])
 * rules(['.button', '&:hover'], [modify(surfaceColor, hoverChange)])
 */
export function modify(variable: Variable, modification: Modification | Variable, options?: { id?: string | symbol }): Declaration {
  variable = resolveVariable(variable)
  return [variable, {
    resourceIdentity: Symbol('variable-modification'),
    onCompile(context, controller) {
      const target = nearestDeclaration(controller, variable, context.conditionPath)
      if (!target) { controller.defer(context.node, `Variable ${variable.name} 的修改找不到父路径定义。`); return }
      const session = sessionOf(context)
      const instance = ensureVariableInstance(context, controller, target)
      const old = session.steps.get(context.node)
      if (old?.instance === instance) { refreshSteps(controller, instance); return }
      if (old) removeModification(context, controller, old, context.node)
      const stored = readJSValue(modification)
      assert(isModification(stored), `Variable ${variable.name} 的修改需要提供可应用的 Modification 规则。`)
      const rule = stored[modificationRule]
      if (!instance.steps.length) {
        instance.baseName = `${variable.name}-modify-${instance.number}-base`
        publishResult(controller, instance, instance.node)
        const alias = instance.results.get(conditionAddressKey(instance.node.conditionPath))!.alias!
        registerInternalVariable(controller, instance, instance.baseName, alias)
      }
      const step = instance.steps.find(step => options?.id !== undefined && step.id === options.id)
        ?? createStep(context, controller, instance, options?.id)
      const output = isFunction(rule) ? rule(step.currentExpression) : applyColorModification(step.currentExpression, modification)
      const gate = `${step.name}-candidate-${++step.count}`
      const selection = controller.insert({ before: context.node, conditionPath: context.conditionPath },
        [undefined, createJSSContent(resolve => resolve(output) === undefined ? undefined : selectionText(step, gate), [output])],
        { owner: context.node, identity: 'modification' })
      step.members.set(context.node, { gate, output, selection })
      session.steps.set(context.node, step)
      publishResult(controller, instance, context.node)
      refreshSteps(controller, instance, step)
      controller.onRemove(context.node, () => {
        const current = session.steps.get(context.node)
        if (current) removeModification(context, controller, current, context.node)
      })
    },
  }]
}

/** 空 token 关闭候选，initial 使 var() 使用该候选表达式；整组始终一同参与层叠。 */
const selectionText = (step: VariableStep, selected = `${step.name}-identity`): string =>
  [`${step.name}-identity`, ...[...step.members.values()].map(member => member.gate)]
    .map(name => `--${name}: ${name === selected ? 'initial' : ''};`).join('\n')
    + (step.instance.variable.config.registration?.inherits === false ? `\n--${step.name}-present: ;` : '')
/** 每个阶段引用前序结果，避免把前序表达式复制进多个分支造成指数展开。 */
function createStep(context: JSSCompileContext, controller: ASTController, instance: VariableInstance, id?: string | symbol): VariableStep {
  const name = `${instance.variable.name}-modify-${instance.number}-step-${++instance.count}`
  const currentExpression = createJSSContent(() => {
    const index = instance.steps.indexOf(step)
    return stageReference(instance, instance.steps[index - 1]?.name)
  })
  const fallback = controller.insert({ before: context.node, conditionPath: instance.node.conditionPath },
    [undefined, createJSSContent(() => selectionText(step))], { owner: instance.node, identity: `${name}/default` })
  const step: VariableStep = { instance, name, anchor: context.node, fallback, currentExpression,
    members: new Map(), count: 0, id }
  registerInternalVariable(controller, instance, name, fallback)
  if (instance.variable.config.registration?.inherits === false)
    registerInternalVariable(controller, instance, `${name}-present`, fallback, { syntax: '*', inherits: false })
  instance.steps.push(step)
  return step
}
/** 同址仅发一份结果链；公开默认引用不覆盖该地址已有的手写公开赋值。 */
function publishResult(controller: ASTController, instance: VariableInstance, member: JSSStyleNode): void {
  const address = conditionAddressKey(member.conditionPath)
  let result = instance.results.get(address)
  const existing = result !== undefined
  if (!result) {
    result = { path: member.conditionPath, members: new Set() }
    instance.results.set(address, result)
  }
  result.members.add(member)
  if (!result.alias && (instance.baseName !== instance.variable.name || instance.steps.length)) {
    const manual = controller.search({ key: instance.variable, conditionPath: result.path })
      .some(node => node !== instance.node && !declaredVariable(node) && !instance.steps.some(step => step.members.has(node)) && node.content !== member.content)
    if (!manual || member === instance.node) result.alias = controller.insert({ before: member, conditionPath: result.path },
      [{ toCSSString: () => instance.variable.toCSSString(), join: joinVariableValues },
        createJSSContent(() => stageReference(instance, instance.steps.at(-1)?.name))],
      { owner: instance.node, identity: `result/${address}`, productTag: instance })
  }
  if (!existing) for (const step of instance.steps) publishStep(controller, step, result)
}
/** 不继承注册的阶段若无本地规则，读取它的注册基础值；普通阶段直接引用。 */
function stageReference(instance: VariableInstance, name = instance.baseName): string {
  const fallback = name !== instance.baseName && instance.variable.config.registration?.inherits === false
    ? `, var(--${instance.baseName})` : ''
  return `var(--${name}${fallback})`
}
/** 在消费处读取选择门和规则依赖，祖先只传递规则选择，不传递已完成的步骤值。 */
function publishStep(controller: ASTController, step: VariableStep, result: VariableResult): void {
  const key = { toCSSString: () => `--${step.name}`, join: joinVariableValues }
  for (const old of controller.search({ key, conditionPath: result.path, productTag: step.instance })) controller.remove(old)
  const expression = createJSSContent(resolve => {
    const branches = [`var(--${step.name}-identity, ${resolve(step.currentExpression)})`]
    for (const member of step.members.values()) {
      const output = resolve(member.output)
      if (output !== undefined) branches.push(`var(--${member.gate}, ${output})`)
    }
    const presence = step.instance.variable.config.registration?.inherits === false ? `var(--${step.name}-present) ` : ''
    return presence + branches.join(' ')
  }, [step.currentExpression, ...[...step.members.values()].map(member => member.output)])
  const anchor = result.alias ?? [...result.members][0]
  controller.insert({ before: anchor, conditionPath: result.path }, [key, expression],
    { owner: result.alias ?? step.instance.node, identity: `${step.name}/result`, productTag: step.instance })
}
/** 按源位置重排步骤；新候选只重建其自身阶段，不重建整个消费链。 */
function refreshSteps(controller: ASTController, instance: VariableInstance, changed?: VariableStep): void {
  if (!controller.nodes().includes(instance.node)) return
  const nodes = controller.search({ key: instance.variable.config.definitionKey })
  for (const step of instance.steps) step.anchor = nodes.find(node => step.members.has(node)) ?? step.anchor
  instance.steps.sort((left, right) => nodes.indexOf(left.anchor) - nodes.indexOf(right.anchor))
  for (const step of instance.steps) {
    for (const [member, candidate] of step.members) controller.move(candidate.selection, { before: member })
    controller.move(step.fallback, { before: step.members.get(step.anchor)!.selection })
    for (const result of instance.results.values()) if (changed === step) publishStep(controller, step, result)
  }
  for (const result of instance.results.values()) {
    if (!result.alias) publishResult(controller, instance, [...result.members][0])
  }
}
/** 退出消费地址；同址还有消费者时保留，空地址的阶段与依赖由 AST 一并撤销。 */
function releaseResult(controller: ASTController, instance: VariableInstance, member: JSSStyleNode): void {
  const address = conditionAddressKey(member.conditionPath)
  const result = instance.results.get(address)
  if (!result) return
  result.members.delete(member)
  if (result.members.size) return
  if (result.alias) controller.remove(result.alias)
  for (const output of controller.search({ conditionPath: result.path, productTag: instance })) controller.remove(output)
  instance.results.delete(address)
}
/** 撤销成员后重排，并删除已无候选的阶段、选择门和注册资源。 */
function removeModification(context: JSSCompileContext, controller: ASTController, step: VariableStep, node: JSSStyleNode): void {
  const candidate = step.members.get(node)
  step.members.delete(node)
  sessionOf(context).steps.delete(node)
  if (candidate) controller.remove(candidate.selection)
  releaseResult(controller, step.instance, node)
  if (!step.members.size) {
    step.instance.steps.splice(step.instance.steps.indexOf(step), 1)
    for (const output of controller.search({ key: { toCSSString: () => `--${step.name}` }, productTag: step.instance })) controller.remove(output)
    controller.remove(step.fallback)
  }
  if (step.instance.steps.length) refreshSteps(controller, step.instance, step)
  else {
    for (const result of step.instance.results.values()) if (result.alias) { controller.remove(result.alias); delete result.alias }
    step.instance.baseName = step.instance.variable.name
  }
}
/** 让修改用的内部 CSS 变量继承公开 Variable 的 @property 约束；未配置时不生成注册节点。 */
function registerInternalVariable(controller: ASTController, instance: VariableInstance, name: string, owner: JSSStyleNode, registration = instance.variable.config.registration): void {
  if (!registration) return
  const path: ConditionPath = { targetConditionPath: [condition(`@property --${name}`)], stateConditionPath: [] }
  const provenance = { owner }
  const position = { before: instance.node, conditionPath: path }
  variableRegistrationDeclarations(registration).forEach(([key, content]) =>
    controller.insert(position, [key, content], { ...provenance, identity: `${name}/${key === 'initial-value' ? 'initial' : key}` }),
  )
}
