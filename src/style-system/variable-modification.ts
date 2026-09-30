/** 局部 Variable 声明与相对修改的 CSS 生成器。

为每个局部声明生成基础值和状态值，再把归属它的修改接成最终 CSS 值。

样式节点增删后，修改仍须按当前归属与顺序从基础值继续计算。
*/
import type { JSSCompileContext, JSSContent } from './content'
import { assert, result } from '@edsolater/fnkit'
import { condition, isSemanticPathPrefix, semanticPathParts, type ConditionPath } from './condition'
import type { Declaration } from './declaration'
import type { JSSStyleNode } from './compiler/rules-to-style-nodes'
import type { JSSKeyObject } from './key'
import type { ASTController } from './compiler/ast-controller'
import { value, type Value, type ValueInput } from './value'
import { resolveStateConditions } from './pieces/state-conditions'
import type { Variable, VariableDefaultValue } from './variable'

/** 一个局部声明的基础值、最终值和修改步骤；只在本次编译内有效。 */
interface VariableInstance {
  node: JSSStyleNode
  variable: Variable
  number: number
  count: number
  baseName: string
  baseKey: JSSKeyObject
  /** 有修改时对外呈现的最终值。 */
  result?: JSSStyleNode
  baseRegistration: JSSStyleNode[]
  /** 同一 ID 的修改共用一步，作用范围限于此局部声明。 */
  shared: Map<string | symbol, VariableStep>
}

/** 局部 Variable 同址赋值保留最后一个实际输出的值。 */
function joinVariableValues(values: Value[]): ValueInput {
  return value(values, { toCSSString: (items, resolve) => {
    let latest: string | undefined
    for (const item of items) {
      const output = resolve(item)
      if (output !== undefined) latest = output
    }
    return latest
  } })
}

/** 一次相对修改：读取前一步结果，在匹配的样式条件下生成新值。 */
interface VariableStep {
  instance: VariableInstance
  name: string
  /** 共用步骤在样式中的排序位置。 */
  anchor: JSSStyleNode
  /** 供修改使用的前一步结果。 */
  input: JSSStyleNode
  /** 修改条件未命中时沿用前一步结果。 */
  fallback: JSSStyleNode
  registration: JSSStyleNode[]
  /** 共用此步的原始修改节点及其条件赋值。 */
  members: Map<JSSStyleNode, JSSStyleNode>
  previous?: VariableStep
  next?: VariableStep
  id?: string | symbol
}
/** 从通用 AST 内容识别已登记的局部声明；未知内容未命中，不扩大其他容器的查询范围。 */
const declaredVariables: WeakMap<object, { variable: Variable; content: VariableDefaultValue }> & {
  get(input: unknown): { variable: Variable; content: VariableDefaultValue } | undefined
} = new WeakMap<object, { variable: Variable; content: VariableDefaultValue }>()
const variableSessions = new WeakMap<object, VariableSession>()
/** 本次编译中，各声明和修改节点所属的局部实例与步骤。 */
interface VariableSession {
  instances: WeakMap<JSSStyleNode, VariableInstance>
  steps: WeakMap<JSSStyleNode, VariableStep>
  nextNumber: number
}
/** 取得本次编译的声明与修改状态；首次访问时建立，编译之间互不影响。 */
function sessionOf(context: JSSCompileContext): VariableSession {
  let session = variableSessions.get(context.session)
  if (!session) {
    session = { instances: new WeakMap(), steps: new WeakMap(), nextNumber: 0 }
    variableSessions.set(context.session, session)
  }
  return session
}
/** 识别局部声明所用的 Variable；其他样式节点返回 undefined。 */
function declaredVariable(node: JSSStyleNode): Variable | undefined {
  return declaredVariables.get(node.content)?.variable
}
/** 找到给定条件所属的最近局部声明，只认同一个 Variable 对象；没有则返回 undefined。 */
function findLocalDeclaration(
  context: JSSCompileContext,
  controller: ASTController,
  variable: Variable,
  path: ConditionPath = context.conditionPath,
): JSSStyleNode | undefined {
  let nearest: JSSStyleNode | undefined
  let depth = -1
  for (const node of controller.search({ key: variable.config.definitionKey })) {
    if (declaredVariable(node) !== variable || !isSemanticPathPrefix(node.conditionPath, path)) continue
    const candidateDepth = semanticPathParts(node.conditionPath).length
    if (candidateDepth > depth) { nearest = node; depth = candidateDepth }
  }
  return nearest
}

/** 找到状态内容应写入的局部基础值，返回其 Key；没有局部声明则返回 undefined。
 * 该局部实例尚未建立时，会同时生成基础值和状态值。
 */
export function findLocalBaseKey(
  context: JSSCompileContext,
  controller: ASTController,
  variable: Variable,
  path: ConditionPath,
): JSSKeyObject | undefined {
  const target = findLocalDeclaration(context, controller, variable, path)
  return target ? ensureVariableInstance(context, controller, target).baseKey : undefined
}

/** 为 Variable 创建局部基础值声明；返回的声明在编译消费时生成基础值，并接管归属它的已有修改。 */
export function declareVariable(
  variable: Variable,
  value: VariableDefaultValue,
  activateResources: (variable: Variable, context: JSSCompileContext, controller: ASTController) => void,
): Declaration {
  const content: JSSContent = {
    resourceIdentity: Symbol('variable-declaration'),
    onCompile(context, controller) {
      activateResources(variable, context, controller)
      ensureVariableInstance(context, controller, context.node)
      // 新局部定义接管已有修改时，重新确定这些修改的归属。
      const session = sessionOf(context)
      for (const node of controller.search({ key: variable.config.definitionKey })) {
        const step = session.steps.get(node)
        if (
          step?.instance.variable === variable &&
          step.instance.node !== context.node &&
          findLocalDeclaration(context, controller, variable, node.conditionPath) === context.node
        )
          node.compileRevision++
      }
      return undefined
    },
  }
  declaredVariables.set(content, { variable, content: value })
  return [{ toCSSString: variable.toCSSString }, content]
}

/** 为局部声明生成基础值及各状态值，并取得这次编译中的修改归属；同一语义路径重复声明会报错。 */
function ensureVariableInstance(context: JSSCompileContext, controller: ASTController, node: JSSStyleNode): VariableInstance {
  const session = sessionOf(context)
  const existing = session.instances.get(node)
  if (existing) return existing
  const { variable, content } = declaredVariables.get(node.content)!
  const path = semanticPathParts(node.conditionPath)
  assert(
    !controller
      .search({ key: variable.config.definitionKey })
      .some(
        (other) =>
          other !== node &&
          declaredVariable(other) === variable &&
          JSON.stringify(semanticPathParts(other.conditionPath)) === JSON.stringify(path),
      ),
    `Variable ${variable.name} 在同一语义路径重复定义。`,
  )
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
    baseRegistration: [],
    shared: new Map(),
  }
  session.instances.set(node, instance)
  controller.insert(
    { before: node, conditionPath: node.conditionPath },
    [instance.baseKey, result(content)],
    { owner: node, identity: 'base' },
  )
  for (const state of resolveStateConditions([...variable.config.states.keys()])) {
    const stateNode = controller.insert(
      {
        before: node,
        conditionPath: {
          targetConditionPath: node.conditionPath.targetConditionPath,
          stateConditionPath: resolveStateConditions([
            ...node.conditionPath.stateConditionPath.map((item) => item.name),
            state.name,
          ]),
          semanticPath: [...(node.conditionPath.semanticPath ?? node.conditionPath.targetConditionPath), state.name],
        },
      },
      [instance.baseKey, variable.config.states.get(state.name)],
      { owner: node, identity: `state/${state.name}` },
    )
    stateNode.readState = state.name
  }
  for (const candidate of controller.search({ productTag: variable })) {
    if (
      candidate.resourceAddress === undefined && findLocalDeclaration(context, controller, variable, candidate.conditionPath) === node
    )
      controller.remove(candidate)
  }
  controller.onRemove(node, () => {
    for (const candidate of controller.search({ key: instance.variable.config.definitionKey }))
      if (session.steps.get(candidate)?.instance === instance) candidate.compileRevision++
  })
  return instance
}

/** 为最近的同一 Variable 局部声明添加修改；编译消费时用 change 生成条件值，缺少声明或 apply 会报错。 */
export function modifyVariable(variable: Variable, change: unknown, id?: string | symbol): Declaration {
  const content: JSSContent = {
    resourceIdentity: Symbol('variable-modification'),
    onCompile(context, controller) {
      const target = findLocalDeclaration(context, controller, variable)
      if (!target) {
        controller.defer(context.node, `Variable ${variable.name} 的修改找不到父路径定义。`)
        return undefined
      }
      const session = sessionOf(context)
      const instance = ensureVariableInstance(context, controller, target)
      const old = session.steps.get(context.node)
      if (old?.instance === instance) return undefined
      if (old) removeModification(context, controller, old, context.node)
      const apply = variable.config.modification?.apply
      assert(!!apply, `Variable ${variable.name} 没有配置 modification.apply。`)
      if (!instance.result) {
        instance.baseName = `${variable.name}-modify-${instance.number}-base`
        instance.baseRegistration = registerInternalVariable(controller, instance, instance.baseName)
        instance.result = controller.insert(
          { before: target, conditionPath: target.conditionPath },
          [{ toCSSString: () => variable.toCSSString(), join: joinVariableValues }, `var(--${instance.baseName})`],
          { owner: target, identity: 'result' },
        )
      }
      let step = id === undefined ? undefined : instance.shared.get(id)
      if (!step) {
        const name = `${variable.name}-modify-${instance.number}-step-${++instance.count}`
        const input = controller.insert(
          { before: target, conditionPath: target.conditionPath },
          [`--${name}-input`, `var(--${instance.baseName})`],
          { owner: target, identity: `${name}/input` },
        )
        const fallback = controller.insert(
          { before: target, conditionPath: target.conditionPath },
          [{ toCSSString: () => `--${name}`, join: joinVariableValues }, `var(--${name}-input)`],
          { owner: target, identity: `${name}/default` },
        )
        step = {
          instance,
          name,
          anchor: context.node,
          input,
          fallback,
          registration: registerInternalVariable(controller, instance, name),
          members: new Map(),
          id,
        }
        if (id !== undefined) instance.shared.set(id, step)
        connectStep(context, controller, step)
      }
      const assignment = controller.insert(
        { before: context.node, conditionPath: context.conditionPath },
        [step.fallback.key!, apply(`var(--${step.name}-input)`, change)],
        { owner: context.node, identity: 'modification' },
      )
      step.members.set(context.node, assignment)
      session.steps.set(context.node, step)
      const first = controller.search({ key: variable.config.definitionKey }).find((node) => step!.members.has(node))!
      if (first !== step.anchor) {
        disconnectStep(step)
        step.anchor = first
        connectStep(context, controller, step)
      }
      controller.move(step.input, { before: assignment })
      controller.move(step.fallback, { before: assignment })
      if (!old)
        controller.onRemove(context.node, () => {
          const current = session.steps.get(context.node)
          if (current) removeModification(context, controller, current, context.node)
        })
      return undefined
    },
  }
  return [{ toCSSString: variable.toCSSString }, content]
}

/** 把修改接到样式顺序中的正确位置，使后续修改从这一步的结果继续。 */
function connectStep(context: JSSCompileContext, controller: ASTController, step: VariableStep): void {
  const session = sessionOf(context)
  const nodes = controller.search({ key: step.instance.variable.config.definitionKey })
  const position = nodes.indexOf(step.anchor)
  const matches = (node: JSSStyleNode): boolean => {
    const other = session.steps.get(node)
    return other !== step && other?.instance === step.instance && other.anchor === node
  }
  const previous = position < 0 ? undefined : nodes.slice(0, position).findLast(matches)
  const next = position < 0 ? undefined : nodes.slice(position + 1).find(matches)
  step.previous = previous ? session.steps.get(previous) : undefined
  step.next = next ? session.steps.get(next) : undefined
  step.input.content = `var(--${step.previous?.name ?? step.instance.baseName})`
  if (step.previous) step.previous.next = step
  if (step.next) {
    step.next.previous = step
    step.next.input.content = `var(--${step.name})`
  } else step.instance.result!.content = `var(--${step.name})`
}
/** 撤出这一步修改，让后续修改继续读取剩余的前序结果。 */
function disconnectStep(step: VariableStep): void {
  if (step.previous) step.previous.next = step.next
  if (step.next) {
    step.next.previous = step.previous
    step.next.input.content = `var(--${step.previous?.name ?? step.instance.baseName})`
  } else if (step.instance.result)
    step.instance.result.content = `var(--${step.previous?.name ?? step.instance.baseName})`
  step.previous = undefined
  step.next = undefined
}
/** 移除一个条件修改；共用步骤还有其他条件时保留，全部移除后重接剩余修改。 */
function removeModification(context: JSSCompileContext, controller: ASTController, step: VariableStep, node: JSSStyleNode): void {
  const assignment = step.members.get(node)
  step.members.delete(node)
  sessionOf(context).steps.delete(node)
  if (assignment) controller.remove(assignment)
  if (step.members.size) {
    if (step.anchor === node) {
      disconnectStep(step)
      step.anchor = controller.search({ key: step.instance.variable.config.definitionKey }).find((candidate) => step.members.has(candidate))!
      connectStep(context, controller, step)
    }
    return
  }
  disconnectStep(step)
  if (step.id !== undefined) step.instance.shared.delete(step.id)
  for (const generated of [step.input, step.fallback, ...step.registration]) controller.remove(generated)
  if (step.instance.result?.content === `var(--${step.instance.baseName})`) {
    controller.remove(step.instance.result)
    step.instance.result = undefined
    for (const registration of step.instance.baseRegistration) controller.remove(registration)
    step.instance.baseRegistration = []
    step.instance.baseName = step.instance.variable.name
  }
}
/** 让修改用的内部 CSS 变量继承公开 Variable 的 @property 约束；未配置时不生成注册节点。 */
function registerInternalVariable(controller: ASTController, instance: VariableInstance, name: string): JSSStyleNode[] {
  const registration = instance.variable.config.registration
  if (!registration) return []
  const path: ConditionPath = { targetConditionPath: [condition(`@property --${name}`)], stateConditionPath: [] }
  const provenance = { owner: instance.node }
  const position = { before: instance.node, conditionPath: path }
  const nodes = [
    controller.insert(position, ['syntax', JSON.stringify(registration.syntax)], { ...provenance, identity: `${name}/syntax` }),
    controller.insert(position, ['inherits', String(registration.inherits)], { ...provenance, identity: `${name}/inherits` }),
  ]
  if (registration.initialValue !== undefined)
    nodes.push(controller.insert(position, ['initial-value', registration.initialValue], { ...provenance, identity: `${name}/initial` }))
  return nodes
}
