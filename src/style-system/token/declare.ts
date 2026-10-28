/**
 * CSS 根据地的声明与状态发布。
 *
 * 保留原始基础、默认保障和状态产物，并通过 AST 查询有效声明。
 *
 * 让局部赋值与根据地状态遵循原生 CSS 作用域。
 */
import { assert, hasProperty, isFunction, result } from '@edsolater/fnkit'
import {
  resolveConditionPath,
  conditionAddressKey,
  appendStateCondition,
  type ConditionPath,
} from '../condition'
import {
  isJSSContent,
  type JSSCompileContext,
  type JSSContent,
  type JSSContentProtocol,
} from '../content'
import type { Declaration } from '../operations/declare'
import { keyPriority, propertyName, type JSSKey } from '../key'
import { isToken, token, type TokenInput, type TokenState } from './core'
import type { ContentView } from '../content'
import { cssCustomProperty, cssOperation, type CSSCustomProperty } from './css'

import type { ASTController, JSSStyleNode } from '../compiler/contracts'

/** 修改链绑定的真实声明及其结果；不持有局部依赖投影。 */
export interface CSSDefinition {
  node: JSSStyleNode
  path: ConditionPath
  variable?: CSSCustomProperty
  baseKey: JSSKey
  /** 读取当前基础声明名；内部自动名可在坍缩前避让晚到的显式占用。 */
  getBaseName(): string
  baseNode?: JSSStyleNode
  stateProducts: Map<string, JSSStyleNode>
  consumers?: Set<JSSStyleNode>
  onConsume?: (node: JSSStyleNode, active: boolean) => void
}
/** 一条具备真实来源身份的 CSS 声明；基础内容在原位置完成编译。 */
interface CSSDeclaration extends JSSContentProtocol {
  kind: 'css-declaration'
  variable: CSSCustomProperty
  content: TokenInput
  dependencies: unknown[]
}
const definitions = new WeakMap<
  JSSStyleNode,
  { input: unknown; revision: number; signature: string; value: CSSDefinition }
>()
const bindings = new WeakMap<
  JSSStyleNode,
  Map<CSSCustomProperty, { definition: CSSDefinition; inputs: Set<unknown> }>
>()
export const cssProductRoles = new WeakMap<
  JSSStyleNode,
  'base' | 'state' | 'control' | 'result'
>()
/** 自动保障产物不是后写的新绑定，不参与截断已登记的修改。 */
export const automaticCSSDeclaration = {}

/**
 * 以当前名称和完整地址识别声明位置变化。
 */
const declarationSignature = (node: JSSStyleNode) =>
  `${propertyName(node.key!)}:${conditionAddressKey(node.conditionPath)}`
/**
 * 选择根据地有效声明，排除修改控制项和派生基础产物。
 */
const findHomeDeclaration = (
  controller: ASTController,
  variable: CSSCustomProperty,
  path: ConditionPath,
) => {
  const query = { key: variable.key, conditionPath: path }
  const eligible = (node: JSSStyleNode) =>
    !node.aggregate &&
    !cssProductRoles.has(node) &&
    (node.content as { kind?: string } | undefined)?.kind !== 'css-modification'
  return (
    controller.findDeclaration(
      query,
      (node) => eligible(node) && node.productTag !== automaticCSSDeclaration,
    ) ??
    controller.findDeclaration(
      query,
      (node) => eligible(node) && node.productTag === automaticCSSDeclaration,
    )
  )
}

/**
 * 根据地使用与 rules 相同的条件输入，不推断 DOM 或选择器包含关系。
 */
export function cssHomePath(
  target: CSSCustomProperty,
  usagePath: ConditionPath,
): ConditionPath {
  if (target.address === undefined) return usagePath
  const targetConditionPath = resolveConditionPath(target.address)!
  return { targetConditionPath, stateConditionPath: [] }
}

/**
 * 同一 CSS 自定义属性保留最后一个有效贡献，不将重复赋值连接为列表。
 */
export const joinCSSPropertyValues = (values: ContentView[]): TokenInput =>
  token(values, {
    toCSSString: (items, resolve) =>
      items.map(resolve).findLast((output) => output !== undefined),
  })

/**
 * 识别持有真实 CSS 目标的声明，普通内容的同名字段不构成声明协议。
 */
export const isCSSDeclaration = (input: unknown): input is CSSDeclaration =>
  hasProperty(input, 'kind', (kind) => kind === 'css-declaration') &&
  hasProperty(
    input,
    'variable',
    (variable) =>
      hasProperty(variable, 'token', isToken) &&
      cssCustomProperty(variable.token) === variable,
  )

/**
 * 读取显式声明绑定的 CSS 目标，不从名称借用另一份定义。
 */
export const declaredCSSProperty = (
  node: JSSStyleNode,
): CSSCustomProperty | undefined =>
  isCSSDeclaration(node.content) ? node.content.variable : undefined

/**
 * 取得本次 AST 声明已经建立的基础和状态产物。
 */
export const cssDefinition = (node: JSSStyleNode): CSSDefinition | undefined =>
  definitions.get(node)?.value

/**
 * 配对 CSS 目标与基础内容，保留声明来源以供修改和撤销。
 */
export function declareCSSProperty(
  variable: CSSCustomProperty,
  content: TokenInput,
): Declaration {
  const declaration: CSSDeclaration = {
    kind: 'css-declaration',
    variable,
    content,
    dependencies: [],
  }
  return [variable.key, declaration]
}

/**
 * 指定地址缺声明才补，按实际消费者共享与释放根据地产物。
 */
export function consumeDeclaration(
  context: JSSCompileContext,
  controller: ASTController,
  variable: CSSCustomProperty,
): CSSDefinition {
  const path = cssHomePath(variable, context.conditionPath)
  const node =
    findHomeDeclaration(controller, variable, path) ??
    controller.insert(
      { before: context.node, conditionPath: path },
      declareCSSProperty(variable, variable.content),
      {
        owner: context.node,
        productTag: automaticCSSDeclaration,
      },
    )
  if (node !== context.node) controller.depend(node, { owner: context.node })
  const definition = ensureDefinition(node, controller, variable)
  assert(
    definition.baseNode !== context.node && definition.node !== context.node,
    'Token 根据地定义存在直接循环引用。',
  )
  let current = bindings.get(context.node)
  if (!current) {
    current = new Map()
    bindings.set(context.node, current)
    controller.onRemove(context.node, () => {
      for (const { definition: bound } of current!.values()) {
        bound.consumers?.delete(context.node)
        bound.onConsume?.(context.node, false)
      }
      current!.clear()
    })
    controller.addSettlementCheck(() => {
      let changed = false
      for (const [target, bound] of current!) {
        if (target.token._kind === 'css-value') bound.inputs.clear()
        for (const input of bound.inputs)
          if (!controller.usesContent(context.node, input))
            bound.inputs.delete(input)
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
        if (
          recorded &&
          recorded.signature !== declarationSignature(bound.definition.node)
        ) {
          ensureDefinition(bound.definition.node, controller, target)
          changed = true
        }
        if (
          findHomeDeclaration(
            controller,
            target,
            cssHomePath(target, context.node.conditionPath),
          ) !== bound.definition.node
        ) {
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
    if (previous)
      controller.release(previous.definition.node, { owner: context.node })
    current.set(variable, { definition, inputs: new Set([context.input]) })
  } else {
    previous.inputs.add(context.input)
  }
  const consumers = (definition.consumers ??= new Set())
  consumers.add(context.node)
  definition.onConsume?.(context.node, true)
  return definition
}

/**
 * 为当前有效声明发布基础和自身状态，输入或位置变化后撤销旧产物再建立。
 */
export function ensureDefinition(
  node: JSSStyleNode,
  controller: ASTController,
  requested: CSSCustomProperty,
): CSSDefinition {
  const previous = definitions.get(node)
  const signature = declarationSignature(node)
  if (
    previous &&
    previous.input === node.content &&
    previous.revision === node.compileRevision &&
    previous.signature === signature
  )
    return previous.value
  if (previous) {
    if (previous.value.baseNode !== node && previous.value.baseNode)
      controller.remove(previous.value.baseNode)
    for (const product of previous.value.stateProducts.values())
      controller.remove(product)
    for (const consumer of previous.value.consumers ?? [])
      if (consumer !== node) consumer.compileRevision++
  }
  const variable = declaredCSSProperty(node) ?? requested
  const baseContent = declaredCSSProperty(node)
    ? (node.content as CSSDeclaration).content
    : (node.content as TokenInput)
  const definition: CSSDefinition = {
    node,
    path: node.conditionPath,
    variable,
    getBaseName: () => propertyName(node.key!).slice(2),
    baseKey: {
      toCSSString: () => `--${definition.getBaseName()}`,
      priority: keyPriority(node.key!),
      join: joinCSSPropertyValues,
    },
    stateProducts: new Map(),
  }
  definitions.set(node, {
    input: node.content,
    revision: node.compileRevision,
    signature,
    value: definition,
  })
  const content = baseContent
  definition.baseNode = controller.insert(
    { before: node, conditionPath: node.conditionPath },
    [definition.baseKey, controller.getCompiledContentView(node, content)],
    {
      owner: node,
      productTag: definition,
      initialize(product) {
        cssProductRoles.set(product, 'base')
        definitions.set(product, {
          input: product.content,
          revision: product.compileRevision,
          signature: declarationSignature(product),
          value: definition,
        })
      },
    },
  )
  // 非根据地显式赋值只建立当地基础；状态发布属于根据地。
  // 同根别名由 AST 统一匹配。
  if (
    controller
      .search({
        key: variable.key,
        conditionPath: cssHomePath(variable, node.conditionPath),
      })
      .includes(node)
  )
    publishHomeStates(
      controller,
      definition,
      baseContent === variable.content
        ? (variable.token.default as TokenInput)
        : baseContent,
      variable.states,
    )
  controller.onRemove(node, () => {
    for (const consumer of definition.consumers ?? [])
      if (consumer !== node) consumer.compileRevision++
  })
  return definition
}

/**
 * 将自身状态发布在根据地基础之后，保留声明键等级和撤销归属。
 */
function publishHomeStates(
  controller: ASTController,
  definition: CSSDefinition,
  baseContent: TokenInput,
  states: TokenState | undefined,
): void {
  const node = definition.node
  let anchor = definition.node
  for (const [state, rule] of states ?? []) {
    const path = appendStateCondition(node.conditionPath, state)
    const content: JSSContent = cssOperation((context, controller) => {
      let base = baseContent
      const seen = new Set<unknown>()
      while (!seen.has(base)) {
        seen.add(base)
        const compiled = controller.getCompiledContent(
          definition.node,
          base,
        ) as TokenInput
        if (compiled === base) break
        base = compiled
      }
      if (isFunction(base) && !isJSSContent(base)) {
        controller.defer(context.node, '状态等待根据地基础完成求值。')
        return
      }
      controller.setContent(
        context,
        isJSSContent(rule) ? rule : result(rule, base),
      )
    })
    const product = controller.insert(
      { after: anchor!, conditionPath: path },
      [definition.baseKey, content],
      {
        owner: node,
        productTag: definition,
        initialize(product) {
          cssProductRoles.set(product, 'state')
        },
      },
    )
    definition.stateProducts.set(conditionAddressKey(path), product)
    anchor = product
  }
}

/**
 * 判断原始声明是否由独立的 CSS 基础产物接管输出。
 */
export const isCSSDefinitionControl = (node: JSSStyleNode): boolean =>
  definitions.has(node) && cssDefinition(node)?.node === node

/**
 * 在每个实际声明位置准备 CSS 声明及其基础内容。
 */
export function prepareCSSDeclaration(
  input: object,
  context: JSSCompileContext,
  controller: ASTController,
): unknown {
  if (!isCSSDeclaration(input)) return input
  ensureDefinition(context.node, controller, input.variable)
  return input.content
}
