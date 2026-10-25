/** 根据地声明、原始基础及自身状态的发布；存在查询统一交给 AST。 */
import { assert, isFunction, result } from '@edsolater/fnkit'
import { condition, conditionAddressKey, type ConditionPath } from '../condition'
import { isJSSContent, type JSSCompileContext, type JSSContent } from '../content'
import type { Declaration } from '../operations/declare'
import { keyPriority, propertyName, type JSSKey } from '../key'
import { appendStateCondition, type StateCondition } from '../pieces/state-conditions'
import { value, type Value, type ValueInput } from '../value'
import { isVariable, referenceVariable, variableResultSource, type VariableDefaultValue, type VariableStateRule, type VariableTarget } from './core'
import type { ASTController, JSSStyleNode } from '../compiler/contracts'

/** 修改链绑定的真实声明及其结果；不持有局部依赖投影。 */
export interface VariableDefinition {
  node: JSSStyleNode
  path: ConditionPath
  variable?: VariableTarget
  baseKey: JSSKey
  baseName?: string
  baseNode?: JSSStyleNode
  stateProducts: Map<string, JSSStyleNode>
  consumers?: Set<JSSStyleNode>
  onConsume?: (node: JSSStyleNode, active: boolean) => void
}
interface VariableDeclaration extends JSSContent {
  kind: 'variable-declaration'
  variable: VariableTarget
  content: VariableDefaultValue
}
const definitions = new WeakMap<JSSStyleNode, { input: unknown; revision: number; signature: string; value: VariableDefinition }>()
const bindings = new WeakMap<JSSStyleNode, Map<VariableTarget, { definition: VariableDefinition; inputs: Set<unknown> }>>()
export const variableProductRoles = new WeakMap<JSSStyleNode, 'base' | 'state' | 'control' | 'result'>()
/** 自动保障产物不是后写的新绑定，不参与截断已登记的修改。 */
export const automaticVariableDeclaration = {}

const declarationSignature = (node: JSSStyleNode) => `${propertyName(node.key!)}:${conditionAddressKey(node.conditionPath)}`
const findHomeDeclaration = (controller: ASTController, variable: VariableTarget) => controller.findDeclaration(
  { key: variable.key, conditionPath: variableHomePath(variable) }, node =>
    !node.aggregate && (node.content as { kind?: string } | undefined)?.kind !== 'variable-modification'
      && Boolean(declaredVariable(node) || variableDefinition(node) || !variableProductRoles.has(node)),
)

/** 根据地使用与 rules 相同的条件输入，不推断 DOM 或选择器包含关系。 */
export function variableHomePath(target: VariableTarget): ConditionPath {
  const address = target.address ?? ':where(:root)'
  const targetConditionPath = (Array.isArray(address) ? address : [address]).map(item => typeof item === 'string' ? condition(item) : item)
  return { targetConditionPath, stateConditionPath: [] }
}

export const joinVariableValues = (values: Value[]): ValueInput => value(values, {
  toCSSString: (items, resolve) => items.map(resolve).findLast(output => output !== undefined),
})

export const declaredVariable = (node: JSSStyleNode): VariableTarget | undefined =>
  (node.content as VariableDeclaration | undefined)?.kind === 'variable-declaration' ? (node.content as VariableDeclaration).variable : undefined

export const variableDefinition = (node: JSSStyleNode): VariableDefinition | undefined => definitions.get(node)?.value

export function declareVariable(variable: VariableTarget, content: VariableDefaultValue, priority = variable.key.priority): Declaration {
  const declaration: VariableDeclaration = {
    kind: 'variable-declaration', variable, content,
    onCompile(context, controller) { ensureDefinition(context.node, controller, variable) },
  }
  return [{ ...referenceVariable(variable), priority }, declaration]
}

/** 指定地址缺声明才补，不查祖先、不搬运消费处公式。 */
export function consumeDeclaration(context: JSSCompileContext, controller: ASTController, variable: VariableTarget): VariableDefinition {
  const path = variableHomePath(variable)
  const node = findHomeDeclaration(controller, variable)
    ?? controller.insert({ before: context.node, conditionPath: path }, declareVariable(variable, variable.content), { owner: context.node, productTag: automaticVariableDeclaration })
  if (node !== context.node) controller.depend(node, { owner: context.node })
  const definition = ensureDefinition(node, controller, variable)
  assert(definition.baseNode !== context.node, 'Variable 根据地定义存在直接循环引用。')
  let current = bindings.get(context.node)
  if (!current) {
    current = new Map()
    bindings.set(context.node, current)
    controller.onRemove(context.node, () => {
      for (const { definition: bound } of current!.values()) { bound.consumers?.delete(context.node); bound.onConsume?.(context.node, false) }
      current!.clear()
    })
    controller.addSettlementCheck(() => {
      let changed = false
      for (const [target, bound] of current!) {
        for (const input of bound.inputs) if (!controller.usesContent(context.node, input)) bound.inputs.delete(input)
        if (!bound.inputs.size) {
          bound.definition.consumers?.delete(context.node)
          bound.definition.onConsume?.(context.node, false)
          controller.release(bound.definition.node, { owner: context.node })
          current!.delete(target)
          changed = true
          continue
        }
        // 地址或名称改变后先修正原显式声明，再让消费按自己的根据地重新查询。
        const recorded = definitions.get(bound.definition.node)
        if (recorded && recorded.signature !== declarationSignature(bound.definition.node)) {
          ensureDefinition(bound.definition.node, controller, target)
          changed = true
        }
        if (findHomeDeclaration(controller, target) !== bound.definition.node) {
          context.node.compileRevision++
          changed = true
        }
      }
      return changed
    })
  }
  const previous = current.get(variable)
  if (previous?.definition !== definition) {
    previous?.definition.consumers?.delete(context.node)
    previous?.definition.onConsume?.(context.node, false)
    if (previous) controller.release(previous.definition.node, { owner: context.node })
    current.set(variable, { definition, inputs: new Set([context.input]) })
  } else {
    previous.inputs.add(context.input)
  }
  const consumers = definition.consumers ??= new Set()
  consumers.add(context.node)
  definition.onConsume?.(context.node, true)
  return definition
}

function ensureDefinition(node: JSSStyleNode, controller: ASTController, requested: VariableTarget): VariableDefinition {
  const previous = definitions.get(node)
  const signature = declarationSignature(node)
  if (previous && previous.input === node.content && previous.revision === node.compileRevision && previous.signature === signature) return previous.value
  if (previous) {
    if (previous.value.baseNode !== node && previous.value.baseNode) controller.remove(previous.value.baseNode)
    for (const product of previous.value.stateProducts.values()) controller.remove(product)
    for (const consumer of previous.value.consumers ?? []) if (consumer !== node) consumer.compileRevision++
  }
  if (!declaredVariable(node)) node.content = declareVariable(isVariable(node.key) ? node.key : requested, node.content as ValueInput)[1]
  const variable = declaredVariable(node)!
  const baseContent = (node.content as VariableDeclaration).content
  const definition: VariableDefinition = {
    node, path: node.conditionPath, variable,
    baseName: propertyName(node.key!).slice(2),
    baseKey: { toCSSString: () => `--${definition.baseName}`, priority: keyPriority(node.key!), join: joinVariableValues },
    stateProducts: new Map(),
  }
  definitions.set(node, { input: node.content, revision: node.compileRevision, signature, value: definition })
  const source = node.productTag === automaticVariableDeclaration && variableResultSource(variable)
  const resultSource = source && propertyName(source.key) !== propertyName(variable.key)
    && controller.search({ key: variable.key, conditionPath: variableHomePath(source) }).includes(node) ? source : undefined
  const content = resultSource && isVariable(variable)
    ? variable.config.resultSourceTransform!(referenceVariable(resultSource))
    : baseContent
  definition.baseNode = controller.insert({ before: node, conditionPath: node.conditionPath }, [definition.baseKey, content], {
    owner: node, productTag: definition,
    initialize(product) {
      variableProductRoles.set(product, 'base')
      definitions.set(product, { input: product.content, revision: product.compileRevision, signature: declarationSignature(product), value: definition })
    },
  })
  // 非根据地显式赋值只建立当地基础；状态发布属于根据地，同根别名由 AST 统一匹配。
  if (controller.search({ key: variable.key, conditionPath: variableHomePath(variable) }).includes(node))
    publishHomeStates(controller, definition, variable, resultSource ? content : baseContent,
      resultSource && isVariable(variable) ? [...variable.states ?? []].filter(([state]) => variable.config.resultSourceStates?.has(state.name)) : variable.states)
  controller.onRemove(node, () => {
    for (const consumer of definition.consumers ?? []) if (consumer !== node) consumer.compileRevision++
  })
  return definition
}

/** 将自身状态发布在根据地基础旁，保留声明键等级和撤销归属。 */
function publishHomeStates(controller: ASTController, definition: VariableDefinition, variable: VariableTarget, baseContent: ValueInput,
  states: Iterable<[StateCondition, VariableStateRule]> = variable.states ?? []): void {
  const node = definition.node
  let anchor = definition.baseNode
  for (const [state, rule] of states ?? []) {
    const path = appendStateCondition(node.conditionPath, state)
    const content: JSSContent = { onCompile(context, controller) {
      let base = baseContent
      const seen = new Set<unknown>()
      while (!seen.has(base)) {
        seen.add(base)
        const compiled = controller.getCompiledContent(definition.baseNode!, base) as ValueInput
        if (compiled === base) break
        base = compiled
      }
      if (isFunction(base) && !isJSSContent(base)) {
        controller.defer(context.node, '状态等待根据地基础完成求值。')
        return
      }
      controller.setContent(context, isJSSContent(rule) ? rule : result(rule, base))
    } }
    const product = controller.insert({ after: anchor!, conditionPath: path }, [definition.baseKey, content], {
      owner: node, productTag: definition,
      initialize(product) { variableProductRoles.set(product, 'state') },
    })
    definition.stateProducts.set(conditionAddressKey(path), product)
    anchor = product
  }
}
