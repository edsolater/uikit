/**
 * CSS 自定义属性根据地定义的完整结果修改链。
 *
 * 消费已选应用，维护实例、步骤、当地结果及撤销。
 *
 * 操作材料不持有 AST 生命周期，修改链在编译会话中按声明归属连接。
 */
import { mapGet } from '@edsolater/fnkit'
import { conditionAddressKey, type ConditionPath } from '../condition'
import {
  createJSSContent,
  type Expression,
  type JSSCompileContext,
} from '../content'
import { keyPriority } from '../key'
import { cssRegistrationDeclarations } from './registration'
import type { CSSCustomProperty } from './css'
import type { Token, TokenInput } from './core'
import { allocateVariableName } from '../custom-property-names'
import {
  automaticCSSDeclaration,
  consumeDeclaration,
  joinCSSPropertyValues,
  cssProductRoles,
  type CSSDefinition,
} from './declare'
import type { ASTController, JSSStyleNode } from '../compiler/contracts'

/**
 * 按根据地的有效声明及书写顺序应用修改，维护消费链和撤销关系。
 */
export function compileCSSModification(
  context: JSSCompileContext,
  controller: ASTController,
  variable: CSSCustomProperty,
  apply: (current: Expression) => TokenInput,
  id?: string | symbol,
): void {
  cssProductRoles.set(context.node, 'control')
  const definition = consumeDeclaration(context, controller, variable)
  const old = steps.get(context.node)
  // 同址后写的显式声明是新的绑定，先前修改不能越过它；子条件修改仍由 CSS 匹配。
  if (
    definition.node.productTag !== automaticCSSDeclaration &&
    conditionAddressKey(context.conditionPath) ===
      conditionAddressKey(definition.path) &&
    controller.compareOrder(context.node, definition.node) < 0
  ) {
    if (old) removeModification(controller, old, context.node)
    return
  }
  const instance = ensureModifyInstance(controller, definition)
  const previous = old?.members.get(context.node)
  const invalidated =
    previous &&
    (previous.input !== context.input ||
      previous.revision !== context.node.compileRevision ||
      old?.id !== id)
  if (old?.instance === instance && old.id === id) {
    if (invalidated) {
      previous.input = context.input
      previous.revision = context.node.compileRevision
      previous.output = apply(old.currentExpression)
      previous.selection.content = candidateSelection(
        old,
        previous.gate,
        previous.output,
      )
    }
    refreshSteps(controller, instance, invalidated ? old : undefined)
    return
  }
  if (old) removeModification(controller, old, context.node)
  if (!instance.steps.length) {
    instance.definition.getBaseName = () =>
      internalVariableName(instance, 'base')
    instance.definition.baseNode!.compileRevision++
    for (const state of instance.definition.stateProducts.values())
      state.compileRevision++
    publishResult(controller, instance, instance.definition.node)
    const alias = instance.results.get(
      conditionAddressKey(instance.definition.node.conditionPath),
    )!.alias!
    registerInternalVariable(
      controller,
      instance,
      () => instance.definition.getBaseName(),
      alias,
    )
  }
  const step =
    instance.steps.find((step) => id !== undefined && step.id === id) ??
    createStep(context, controller, instance, id)
  const output = apply(step.currentExpression)
  const role = `${step.role}/candidate/${++step.count}`
  /**
   * 读取候选当前名称，使输出避让本次编译中晚到的显式占用。
   */
  const gate = () => internalVariableName(instance, role)
  const selection = controller.insert(
    { before: context.node, conditionPath: context.conditionPath },
    [undefined, candidateSelection(step, gate, output)],
    { owner: context.node, identity: 'modification' },
  )
  step.members.set(context.node, {
    gate,
    output,
    selection,
    input: context.input,
    revision: context.node.compileRevision,
  })
  steps.set(context.node, step)
  publishResult(controller, instance, context.node)
  refreshSteps(controller, instance, step)
  for (const consumer of definition.consumers ?? [])
    publishResult(controller, instance, consumer)
  controller.onRemove(context.node, () => {
    const current = steps.get(context.node)
    if (current) removeModification(controller, current, context.node)
  })
}

/** 一个消费地址的本地结果链；同址消费者共享，条件与继承交给 CSS。 */
interface CSSPropertyResult {
  path: ConditionPath
  members: Set<JSSStyleNode>
  alias?: JSSStyleNode
}
/** 一步修改的候选规则及 CSS 选择门；共享 ID 由原选择器层叠决定候选。 */
interface CSSModificationStep {
  instance: CSSModificationInstance
  role: string
  name: string
  identityName: string
  presenceName?: string
  anchor: JSSStyleNode
  fallback: JSSStyleNode
  members: Map<
    JSSStyleNode,
    {
      gate: () => string
      output: TokenInput
      selection: JSSStyleNode
      input: unknown
      revision: number
    }
  >
  currentExpression: Expression
  count: number
  id?: string | symbol
}
/** 仅已启用修改的声明拥有步骤实例。 */
interface CSSModificationInstance {
  definition: CSSDefinition
  count: number
  steps: CSSModificationStep[]
  results: Map<string, CSSPropertyResult>
}
/** 声明和节点本身属于单次 AST，不再套第二层会话身份。 */
const instances = new WeakMap<CSSDefinition, CSSModificationInstance>()
const steps = new WeakMap<JSSStyleNode, CSSModificationStep>()
/** 只复用根据地地址及角色的分配结果；名称占用与避让仍由统一分配器负责。 */
const internalNames = new WeakMap<Token, Map<string, string>>()

/**
 * 为同一 Token 根据地的内部角色分配稳定名称，不跨编译保存 AST 或资源。
 */
function internalVariableName(
  instance: CSSModificationInstance,
  role: string,
): string {
  const token = instance.definition.variable!.token
  let names = internalNames.get(token)
  if (!names) internalNames.set(token, (names = new Map()))
  const key = `${conditionAddressKey(instance.definition.path)}/${role}`
  const name = allocateVariableName(undefined, names.get(key))
  names.set(key, name)
  return name
}

/**
 * 首次修改才建立步骤状态；基础撤销精确清旧链，声明负责消费者重访。
 */
function ensureModifyInstance(
  controller: ASTController,
  definition: CSSDefinition,
): CSSModificationInstance {
  const existing = instances.get(definition)
  if (existing) return existing
  const instance: CSSModificationInstance = {
    definition,
    count: 0,
    steps: [],
    results: new Map(),
  }
  instances.set(definition, instance)
  definition.onConsume = (node, active) =>
    active
      ? publishResult(controller, instance, node)
      : releaseResult(controller, instance, node)
  controller.onRemove(definition.baseNode!, () => {
    for (const product of controller.search({ productTag: instance }))
      controller.remove(product)
    for (const step of instance.steps) {
      controller.remove(step.fallback)
      for (const [node, candidate] of step.members) {
        controller.remove(candidate.selection)
        node.compileRevision++
      }
    }
  })
  return instance
}

/**
 * 输出当前步骤的候选选择声明；空 token 关闭候选，
 * initial 使 var() 使用对应表达式。
 */
const selectionText = (
  step: CSSModificationStep,
  selected = step.identityName,
): string =>
  [
    step.identityName,
    ...[...step.members.values()].map((member) => member.gate()),
  ]
    .map((name) => `--${name}: ${name === selected ? 'initial' : ''};`)
    .join('\n') + (step.presenceName ? `\n--${step.presenceName}: ;` : '')

/**
 * 更新同一候选的配方，不增加阶段或改变共享 ID 与源顺序。
 */
const candidateSelection = (
  step: CSSModificationStep,
  gate: () => string,
  output: TokenInput,
): Expression =>
  createJSSContent(
    (resolve) =>
      resolve(output) === undefined ? undefined : selectionText(step, gate()),
    [output],
  )
/**
 * 建立引用前序结果的新修改阶段，未命中时沿用前序值。
 */
function createStep(
  context: JSSCompileContext,
  controller: ASTController,
  instance: CSSModificationInstance,
  id?: string | symbol,
): CSSModificationStep {
  const role = `step/${++instance.count}`
  const currentExpression = createJSSContent(() => {
    const index = instance.steps.indexOf(step)
    return stageReference(instance, instance.steps[index - 1]?.name)
  })
  const fallback = controller.insert(
    {
      before: context.node,
      conditionPath: instance.definition.node.conditionPath,
    },
    [undefined, createJSSContent(() => selectionText(step))],
    { owner: instance.definition.node, identity: `${role}/default` },
  )
  const step: CSSModificationStep = {
    instance,
    role,
    get name() {
      return internalVariableName(instance, role)
    },
    get identityName() {
      return internalVariableName(instance, `${role}/identity`)
    },
    get presenceName() {
      return instance.definition.variable!.registration?.inherits === false
        ? internalVariableName(instance, `${role}/present`)
        : undefined
    },
    anchor: context.node,
    fallback,
    currentExpression,
    members: new Map(),
    count: 0,
    id,
  }
  registerInternalVariable(controller, instance, () => step.name, fallback)
  if (step.presenceName)
    registerInternalVariable(
      controller,
      instance,
      () => step.presenceName!,
      fallback,
      { syntax: '*', inherits: false },
    )
  instance.steps.push(step)
  return step
}
/**
 * 为当前消费地址发布共享结果链，公开赋值与其他声明统一进入 Join 的等级选择。
 */
function publishResult(
  controller: ASTController,
  instance: CSSModificationInstance,
  member: JSSStyleNode,
): void {
  const address = conditionAddressKey(member.conditionPath)
  const existing = instance.results.has(address)
  const result = mapGet(instance.results, address, () => ({
    path: member.conditionPath,
    members: new Set<JSSStyleNode>(),
  }))
  result.members.add(member)
  if (
    !result.alias &&
    (instance.definition.getBaseName() !==
      instance.definition.variable!.key.toCSSString().slice(2) ||
      instance.steps.length)
  ) {
    result.alias = controller.insert(
      { before: member, conditionPath: result.path },
      [
        {
          /**
           * 发布当前目标名称，聚合保留最后一个有效局部结果。
           */
          toCSSString: () => instance.definition.variable!.key.toCSSString(),
          priority: keyPriority(instance.definition.node.key),
          join: joinCSSPropertyValues,
        },
        createJSSContent(() =>
          stageReference(instance, instance.steps.at(-1)?.name),
        ),
      ],
      {
        owner: instance.definition.node,
        identity: `result/${address}`,
        productTag: instance,
        initialize: (node) => {
          cssProductRoles.set(node, 'result')
        },
      },
    )
  }
  if (!existing)
    for (const step of instance.steps) publishStep(controller, step, result)
}
/**
 * 返回阶段值引用；不继承注册的阶段缺少本地规则时使用其基础值。
 */
function stageReference(
  instance: CSSModificationInstance,
  name = instance.definition.getBaseName(),
): string {
  const fallback =
    name !== instance.definition.getBaseName() &&
    instance.definition.variable!.registration?.inherits === false
      ? `, var(--${instance.definition.getBaseName()})`
      : ''
  return `var(--${name}${fallback})`
}
/**
 * 在消费地址发布当前步骤表达式；祖先传递候选选择，
 * 局部覆盖的依赖在当地重新计算。
 */
function publishStep(
  controller: ASTController,
  step: CSSModificationStep,
  result: CSSPropertyResult,
): void {
  const key = {
    /**
     * 当前步骤的结果目标，归属于同一局部修改链。
     */
    toCSSString: () => `--${step.name}`,
    join: joinCSSPropertyValues,
  }
  for (const old of controller.search({
    key,
    conditionPath: result.path,
    productTag: step.instance,
  }))
    controller.remove(old)
  const expression = createJSSContent(
    (resolve) => {
      const branches = [
        `var(--${step.identityName}, ${resolve(step.currentExpression)})`,
      ]
      for (const member of step.members.values()) {
        const output = resolve(member.output)
        if (output !== undefined)
          branches.push(`var(--${member.gate()}, ${output})`)
      }
      const presence = step.presenceName ? `var(--${step.presenceName}) ` : ''
      return presence + branches.join(' ')
    },
    [
      step.currentExpression,
      ...[...step.members.values()].map((member) => member.output),
    ],
  )
  const anchor = result.alias ?? [...result.members][0]
  controller.insert(
    { before: anchor, conditionPath: result.path },
    [key, expression],
    {
      owner: result.alias ?? step.instance.definition.node,
      identity: `${step.name}/result`,
      productTag: step.instance,
      initialize: (node) => {
        cssProductRoles.set(node, 'result')
      },
    },
  )
}
/**
 * 按样式书写顺序更新修改链；已有引用随步骤顺序变化，新候选更新自身阶段输出。
 */
function refreshSteps(
  controller: ASTController,
  instance: CSSModificationInstance,
  changed?: CSSModificationStep,
): void {
  if (!controller.nodes().includes(instance.definition.node)) return
  const nodes = controller.search({ key: instance.definition.variable!.key })
  for (const step of instance.steps)
    step.anchor = nodes.find((node) => step.members.has(node)) ?? step.anchor
  instance.steps.sort(
    (left, right) => nodes.indexOf(left.anchor) - nodes.indexOf(right.anchor),
  )
  for (const step of instance.steps) {
    for (const [member, candidate] of step.members)
      controller.move(candidate.selection, { before: member })
    controller.move(step.fallback, {
      before: step.members.get(step.anchor)!.selection,
    })
    for (const result of instance.results.values())
      if (changed === step) publishStep(controller, step, result)
  }
  for (const result of instance.results.values()) {
    if (!result.alias)
      publishResult(controller, instance, [...result.members][0])
  }
}
/**
 * 撤销当前消费者；同址还有消费者时保留结果，否则撤销该地址的阶段及依赖。
 */
function releaseResult(
  controller: ASTController,
  instance: CSSModificationInstance,
  member: JSSStyleNode,
): void {
  const address = conditionAddressKey(member.conditionPath)
  const result = instance.results.get(address)
  if (!result) return
  result.members.delete(member)
  if (result.members.size) return
  if (result.alias) controller.remove(result.alias)
  for (const output of controller.search({
    conditionPath: result.path,
    productTag: instance,
  }))
    controller.remove(output)
  instance.results.delete(address)
}
/**
 * 撤销一次修改并更新后续结果；阶段没有候选时同时撤销它的选择声明和注册资源。
 */
function removeModification(
  controller: ASTController,
  step: CSSModificationStep,
  node: JSSStyleNode,
): void {
  const candidate = step.members.get(node)
  step.members.delete(node)
  steps.delete(node)
  if (candidate) controller.remove(candidate.selection)
  releaseResult(controller, step.instance, node)
  if (!step.members.size) {
    step.instance.steps.splice(step.instance.steps.indexOf(step), 1)
    for (const output of controller.search({
      key: `--${step.name}`,
      productTag: step.instance,
    }))
      controller.remove(output)
    controller.remove(step.fallback)
  }
  if (step.instance.steps.length) refreshSteps(controller, step.instance, step)
  else {
    for (const result of step.instance.results.values())
      if (result.alias) {
        controller.remove(result.alias)
        delete result.alias
      }
    step.instance.definition.getBaseName = () =>
      step.instance.definition.variable!.key.toCSSString().slice(2)
  }
}
/**
 * 将公开 CSS 自定义属性的 @property 约束应用到修改用的内部变量；
 * 未配置时不生成注册。
 */
function registerInternalVariable(
  controller: ASTController,
  instance: CSSModificationInstance,
  name: () => string,
  owner: JSSStyleNode,
  registration = instance.definition.variable!.registration,
): void {
  if (!registration) return
  const path: ConditionPath = {
    targetConditionPath: [
      {
        get header() {
          return `@property --${name()}`
        },
      },
    ],
    stateConditionPath: [],
  }
  const provenance = { owner }
  const position = { before: instance.definition.node, conditionPath: path }
  cssRegistrationDeclarations(registration).forEach(([key, content]) =>
    controller.insert(position, [key, content], {
      ...provenance,
      identity: `${name()}/${key === 'initial-value' ? 'initial' : key}`,
    }),
  )
}
