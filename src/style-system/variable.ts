/** Variable 创建与引用链延伸；定义只供内部编译使用。 */
import { condition, media } from './condition'
import type { Rules } from './rule'
import type { Valuable } from './valuable'
import type { ASTController } from './compiler/ast-controller'
import { cssContent, isCSSContent, value, type ValueInput } from './value'
import { resolveStateConditions } from './materials/state-conditions'

/** Variable 可直接保存内容，也可在编译消费时生成内容。 */
export type VariableSource = ValueInput | (() => ValueInput)

/** 可引用、可赋值的黑盒 CSS Variable。 */
export interface Variable extends Valuable {
  kind: 'variable'
  name: string
  parseWaveIndex?: number
  parse(astController: ASTController): ValueInput
}
/** Variable 的名称、状态配方与可选根值、注册配置；状态回调接收创建时的原始来源。 */
export interface VariableOptions<Source extends VariableSource = VariableSource> {
  name: string
  states?: Record<string, ValueInput | ((source: Source) => ValueInput)>
  root?: { value: ValueInput; dark?: ValueInput; reducedMotion?: ValueInput }
  registration?: { syntax: string; inherits: boolean; initialValue?: ValueInput }
  parseWaveIndex?: number
}
interface VariableDefinition {
  source: VariableSource
  states: Map<string, ValueInput>
  inherited?: Variable
}
const definitions = new WeakMap<Variable, VariableDefinition>()

/** 变量局部声明仍可按条件提供内容。 */
export type VariableOverrides = [condition: string | undefined, value: ValueInput][]
export type VariableInput = ValueInput | VariableOverrides
export function isVariable(input: unknown): input is Variable {
  return input !== null && (typeof input === 'object' || typeof input === 'function')
    && 'kind' in input && input.kind === 'variable'
}
/** 可调用的 Parseable 也是内容对象，不应被误当作 source 工厂或状态回调。 */
function isParseableFunction(input: unknown): boolean {
  return typeof input === 'function' && 'parse' in input && typeof input.parse === 'function'
}
/** 排除同样可调用的 Variable、CSS Function 与 Parseable，只识别普通 source 函数。 */
export function isVariableSourceFunction(input: VariableSource): input is () => ValueInput {
  return typeof input === 'function' && !isVariable(input) && !isCSSContent(input) && !isParseableFunction(input)
}
/** 创建定义；回调只在创建时求值，收到原始首参数。 */
export function variable<Source extends VariableSource>(source: Source, options: VariableOptions<NoInfer<Source>>): Variable {
  const reference = { kind: 'variable' as const, name: options.name.replace(/^--/, '') } as Variable
  if (options.parseWaveIndex !== undefined) reference.parseWaveIndex = options.parseWaveIndex
  const states = new Map<string, ValueInput>()
  for (const [name, content] of Object.entries(options.states ?? {})) {
    states.set(name, typeof content === 'function' && !isVariable(content) && !isCSSContent(content) && !isParseableFunction(content)
      ? content(source) : content as ValueInput)
  }
  definitions.set(reference, { source, states })
  reference.parse = (astController) => {
    astController.activate(reference)
    if (astController.claimOnce(reference)) {
      const registration = options.registration
      if (registration) {
        const address = `variable-registration:${reference.name}`
        astController.replaceResource(address)
        const registrationPath = {
          targetConditionPath: [condition(`@property --${reference.name}`)],
          stateConditionPath: [],
        }
        astController.insertResource(address, registrationPath, 'syntax', JSON.stringify(registration.syntax))
        astController.insertResource(address, registrationPath, 'inherits', String(registration.inherits))
        if (registration.initialValue !== undefined) astController.insertResource(address, registrationPath, 'initial-value', registration.initialValue)
      }
      const root = options.root
      if (root) {
        astController.insertVariableDefinition({
          targetConditionPath: [condition(':where(:root)')], stateConditionPath: [],
        }, reference, root.value)
        if (root.dark !== undefined) astController.insertVariableDefinition({
          targetConditionPath: [condition(':where(:root)'), condition('&:where([data-theme="dark"])')], stateConditionPath: [],
        }, reference, root.dark)
        if (root.reducedMotion !== undefined) astController.insertVariableDefinition({
          targetConditionPath: [condition(':where(:root)'), media('(prefers-reduced-motion: reduce)'), condition('&')], stateConditionPath: [],
        }, reference, root.reducedMotion)
      }
    }
    if (astController.role === 'declaration-key') return value(`var(--${reference.name})`)

    const definition = variableDefinition(reference)
    const sourceValue = isVariableSourceFunction(definition.source) ? definition.source() : definition.source
    const stateConditions = resolveStateConditions(collectStateNames(reference))
    if (stateConditions.length) {
      const stateScope = astController.isVariableDefinition
        ? { targetConditionPath: [...astController.conditionPath.targetConditionPath], stateConditionPath: [] }
        : astController.conditionPath
      const activeState = astController.isVariableDefinition ? undefined
        : [...stateConditions].reverse().find((state) => astController.conditionPath.stateConditionPath.some((current) => current.name === state.name))
      const defaultValue = activeState && definition.states.has(activeState.name)
        ? definition.states.get(activeState.name)
        : sourceValue
      astController.insertVariableDefinition(stateScope, reference, defaultValue)

      for (const state of stateConditions) {
        if (activeState && state.order <= activeState.order) continue
        const stateValue = definition.states.has(state.name) ? definition.states.get(state.name) : sourceValue
        astController.insertVariableDefinition({
          targetConditionPath: [...stateScope.targetConditionPath],
          stateConditionPath: resolveStateConditions([
            ...stateScope.stateConditionPath.map((current) => current.name), state.name,
          ]),
        }, reference, stateValue)
      }
    }

    const contents: ValueInput[] = sourceValue === undefined ? [] : [sourceValue]
    return value(cssContent((read) => {
      const fallback = contents.length ? read(contents[0]) : undefined
      return fallback === undefined ? `var(--${reference.name})` : `var(--${reference.name}, ${fallback})`
    }, contents))
  }
  return reference
}

/** 合并延伸链上的状态身份；每个成员保留自身定义来源。 */
function collectStateNames(reference: Variable): string[] {
  const definition = variableDefinition(reference)
  return [...new Set([...(definition.inherited ? collectStateNames(definition.inherited) : []), ...definition.states.keys()])]
}
/** 延伸保存来源引用和自身覆盖，不复制来源定义。 */
export function variableFrom<Source extends Variable>(source: Source, options: VariableOptions<NoInfer<Source>>): Variable {
  const reference = variable(source, options)
  definitions.get(reference)!.inherited = source
  return reference
}
/** 内部编译入口，不从公共入口导出配置访问。 */
export function variableDefinition(reference: Variable): VariableDefinition {
  const definition = definitions.get(reference)
  if (!definition) throw new Error('Variable 缺少定义。')
  return definition
}
/** Cluster 与默认成员共用内部定义。 */
export function connectVariable(reference: Variable, source: Variable): void {
  definitions.set(reference, variableDefinition(source))
}
