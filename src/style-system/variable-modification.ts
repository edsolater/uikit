/** 局部声明与相对修改的编译实现：维护基础值及修改步骤的连接、重绑和清理。 */
import { isJSSContent, type JSSContent } from './content'
import { shrinkFn } from '@edsolater/fnkit'
import { condition, semanticPathParts, type ConditionPath } from './condition'
import type { Declaration } from './declaration'
import type { JSSStyleNode } from './compiler/rules-to-style-nodes'
import type { JSSKeyObject } from './key'
import type { ASTController } from './compiler/ast-controller'
import type { ValueInput } from './value'
import { resolveStateConditions } from './pieces/state-conditions'
import type { Variable, VariableDefaultValue } from './variable'

/** 一次局部声明在编译会话中的基础值、最终值与共享修改项。 */
interface VariableInstance {
  node: JSSStyleNode
  reference: Variable
  number: number
  count: number
  baseName: string
  baseKey: JSSKeyObject
  result?: JSSStyleNode
  baseRegistration: JSSStyleNode[]
  shared: Map<string | symbol, VariableStep>
}
/** 一项相对修改在编译会话中的输入、输出及相邻关系。 */
interface VariableStep {
  instance: VariableInstance
  name: string
  anchor: JSSStyleNode
  input: JSSStyleNode
  fallback: JSSStyleNode
  registration: JSSStyleNode[]
  members: Map<JSSStyleNode, JSSStyleNode>
  previous?: VariableStep
  next?: VariableStep
  id?: string | symbol
}
const declaredVariables = new WeakMap<object, { reference: Variable; content: VariableDefaultValue }>()
const variableInstances = {}
/** 本次编译的位置实例与修改步骤。 */
interface VariableSession {
  instances: WeakMap<JSSStyleNode, VariableInstance>
  steps: WeakMap<JSSStyleNode, VariableStep>
  nextNumber: number
}
/** 取得当前编译的 Variable 局部状态。 */
function sessionOf(controller: ASTController): VariableSession {
  return controller.sessionValue(variableInstances, () => ({
    instances: new WeakMap(),
    steps: new WeakMap(),
    nextNumber: 0,
  }))
}
/** 识别样式节点中由 Variable.declare 创建的引用。 */
function declaredReference(node: JSSStyleNode): Variable | undefined {
  return node.content && typeof node.content === 'object' ? declaredVariables.get(node.content)?.reference : undefined
}
/** 沿语义父链寻找最近的同一 Variable 局部声明。 */
function findLocalDeclaration(
  controller: ASTController,
  reference: Variable,
  path: ConditionPath = controller.conditionPath,
): JSSStyleNode | undefined {
  return controller.findParent((node) => declaredReference(node) === reference, path)
}

/** 返回当前语义父链的局部基础声明目标，供普通状态声明沿用。 */
export function findLocalBaseKey(
  controller: ASTController,
  reference: Variable,
  path: ConditionPath,
): JSSKeyObject | undefined {
  const target = findLocalDeclaration(controller, reference, path)
  return target ? ensureVariableInstance(controller, target).baseKey : undefined
}

/** 返回局部声明；编译消费时建立基础值并接纳归属于它的修改。 */
export function declareVariable(
  reference: Variable,
  value: VariableDefaultValue,
  activateResources: (reference: Variable, controller: ASTController) => void,
): Declaration {
  const content: JSSContent = {
    resourceIdentity: Symbol('variable-declaration'),
    parse(controller) {
      activateResources(reference, controller)
      ensureVariableInstance(controller, controller.node)
      // 迟到的定义只使现在归属于它的修改重新解析。
      const session = sessionOf(controller)
      for (const node of controller.nodes()) {
        const step = session.steps.get(node)
        if (
          step?.instance.reference === reference &&
          step.instance.node !== controller.node &&
          findLocalDeclaration(controller, reference, node.conditionPath) === controller.node
        )
          controller.revisit(node)
      }
      return undefined
    },
  }
  declaredVariables.set(content, { reference, content: value })
  return [{ toCSSString: reference.toCSSString }, content]
}

/** 为局部声明建立基础值、状态值和后续修改的归属位置。 */
function ensureVariableInstance(controller: ASTController, node: JSSStyleNode): VariableInstance {
  const session = sessionOf(controller)
  const existing = session.instances.get(node)
  if (existing) return existing
  const { reference, content } = declaredVariables.get(node.content as object)!
  const path = semanticPathParts(node.conditionPath)
  if (
    controller
      .nodes()
      .some(
        (other) =>
          other !== node &&
          declaredReference(other) === reference &&
          JSON.stringify(semanticPathParts(other.conditionPath)) === JSON.stringify(path),
      )
  )
    throw new Error(`Variable ${reference.name} 在同一语义路径重复定义。`)
  const instance: VariableInstance = {
    node,
    reference,
    number: ++session.nextNumber,
    count: 0,
    baseName: reference.name,
    baseKey: { toCSSString: () => `--${instance.baseName}` },
    baseRegistration: [],
    shared: new Map(),
  }
  session.instances.set(node, instance)
  controller.insertAt(
    node,
    'base',
    node.conditionPath,
    instance.baseKey,
    isJSSContent(content) ? content : shrinkFn(content),
  )
  for (const state of resolveStateConditions([...reference.config.states.keys()])) {
    const stateNode = controller.insertAt(
      node,
      `state/${state.name}`,
      {
        targetConditionPath: node.conditionPath.targetConditionPath,
        stateConditionPath: resolveStateConditions([
          ...node.conditionPath.stateConditionPath.map((item) => item.name),
          state.name,
        ]),
        semanticPath: [...(node.conditionPath.semanticPath ?? node.conditionPath.targetConditionPath), state.name],
      },
      instance.baseKey,
      reference.config.states.get(state.name),
    )
    stateNode.readState = state.name
  }
  for (const candidate of controller.productsByTag(reference)) {
    if (
      findLocalDeclaration(controller, reference, candidate.conditionPath) === node
    )
      controller.removeNode(candidate)
  }
  controller.onRemove(node, () => {
    for (const candidate of controller.nodes())
      if (session.steps.get(candidate)?.instance === instance) controller.revisit(candidate)
  })
  return instance
}

/** 返回相对修改声明；编译时按最近的局部声明接入修改链。 */
export function modifyVariable(reference: Variable, change: unknown, id?: string | symbol): Declaration {
  const content: JSSContent = {
    resourceIdentity: Symbol('variable-modification'),
    parse(controller) {
      const target = findLocalDeclaration(controller, reference)
      if (!target) {
        controller.defer(`Variable ${reference.name} 的修改找不到父路径定义。`)
        return undefined
      }
      const session = sessionOf(controller)
      const instance = ensureVariableInstance(controller, target)
      const old = session.steps.get(controller.node)
      if (old?.instance === instance) return undefined
      if (old) removeModification(controller, old, controller.node)
      const apply = reference.config.modification?.apply
      if (!apply) throw new Error(`Variable ${reference.name} 没有配置 modification.apply。`)
      if (!instance.result) {
        instance.baseName = `${reference.name}-modify-${instance.number}-base`
        instance.baseRegistration = registerInternalVariable(controller, instance, instance.baseName)
        instance.result = controller.insertAt(
          target,
          'result',
          target.conditionPath,
          reference.toCSSString(),
          `var(--${instance.baseName})`,
        )
      }
      let step = id === undefined ? undefined : instance.shared.get(id)
      if (!step) {
        const name = `${reference.name}-modify-${instance.number}-step-${++instance.count}`
        const input = controller.insertAt(
          target,
          `${name}/input`,
          target.conditionPath,
          `--${name}-input`,
          `var(--${instance.baseName})`,
        )
        const fallback = controller.insertAt(
          target,
          `${name}/default`,
          target.conditionPath,
          `--${name}`,
          `var(--${name}-input)`,
        )
        step = {
          instance,
          name,
          anchor: controller.node,
          input,
          fallback,
          registration: registerInternalVariable(controller, instance, name),
          members: new Map(),
          id,
        }
        if (id !== undefined) instance.shared.set(id, step)
        connectStep(controller, step)
      }
      const assignment = controller.insertAt(
        controller.node,
        'modification',
        controller.conditionPath,
        `--${step.name}`,
        apply(`var(--${step.name}-input)`, change),
      )
      step.members.set(controller.node, assignment)
      session.steps.set(controller.node, step)
      const first = controller.nodes().find((node) => step!.members.has(node))!
      if (first !== step.anchor) {
        disconnectStep(step)
        step.anchor = first
        connectStep(controller, step)
      }
      controller.moveBefore(step.input, assignment)
      controller.moveBefore(step.fallback, assignment)
      if (!old)
        controller.onRemove(controller.node, () => {
          const current = session.steps.get(controller.node)
          if (current) removeModification(controller, current, controller.node)
        })
      return undefined
    },
  }
  return [{ toCSSString: reference.toCSSString }, content]
}

/** 按当前 AST 位置连接修改项，让输出引用相邻修改的结果。 */
function connectStep(controller: ASTController, step: VariableStep): void {
  const session = sessionOf(controller)
  const neighbors = controller.neighbors((node) => {
    const other = session.steps.get(node)
    return other !== step && other?.instance === step.instance && other.anchor === node
  }, step.anchor)
  step.previous = neighbors.previous ? session.steps.get(neighbors.previous) : undefined
  step.next = neighbors.next ? session.steps.get(neighbors.next) : undefined
  step.input.content = `var(--${step.previous?.name ?? step.instance.baseName})`
  if (step.previous) step.previous.next = step
  if (step.next) {
    step.next.previous = step
    step.next.input.content = `var(--${step.name})`
  } else step.instance.result!.content = `var(--${step.name})`
}
/** 从相邻修改链中移除步骤，并重连剩余步骤。 */
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
/** 撤销一处修改的输出；共享 ID 的其他条件仍可保留该步骤。 */
function removeModification(controller: ASTController, step: VariableStep, node: JSSStyleNode): void {
  const assignment = step.members.get(node)
  step.members.delete(node)
  sessionOf(controller).steps.delete(node)
  if (assignment) controller.removeNode(assignment)
  if (step.members.size) {
    if (step.anchor === node) {
      disconnectStep(step)
      step.anchor = controller.nodes().find((candidate) => step.members.has(candidate))!
      connectStep(controller, step)
    }
    return
  }
  disconnectStep(step)
  if (step.id !== undefined) step.instance.shared.delete(step.id)
  for (const generated of [step.input, step.fallback, ...step.registration]) controller.removeNode(generated)
  if (step.instance.result?.content === `var(--${step.instance.baseName})`) {
    controller.removeNode(step.instance.result)
    step.instance.result = undefined
    for (const registration of step.instance.baseRegistration) controller.removeNode(registration)
    step.instance.baseRegistration = []
    step.instance.baseName = step.instance.reference.name
  }
}
/** 为修改链的内部 CSS Variable 生成匹配的 @property 注册。 */
function registerInternalVariable(controller: ASTController, instance: VariableInstance, name: string): JSSStyleNode[] {
  const registration = instance.reference.config.registration
  if (!registration) return []
  const path: ConditionPath = { targetConditionPath: [condition(`@property --${name}`)], stateConditionPath: [] }
  return [
    controller.insertAt(instance.node, `${name}/syntax`, path, 'syntax', JSON.stringify(registration.syntax)),
    controller.insertAt(instance.node, `${name}/inherits`, path, 'inherits', String(registration.inherits)),
    ...(registration.initialValue === undefined
      ? []
      : [controller.insertAt(instance.node, `${name}/initial`, path, 'initial-value', registration.initialValue)]),
  ]
}
