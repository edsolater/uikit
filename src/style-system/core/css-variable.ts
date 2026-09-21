/** Variable 创建与引用链延伸；定义只供内部编译使用。 */
import { condition, media } from './css-condition'
import type { Rules } from './css-rule'
import type { Valuable } from './css-valuable'
import { isCSSContent, type ValueInput } from './css-value'

/** Variable 可直接保存内容，也可在编译消费时生成内容。 */
export type VariableSource = ValueInput | (() => ValueInput)

/** 可引用、可赋值的黑盒 CSS Variable。 */
export interface Variable extends Valuable {
  kind: 'variable'
  name: string
}
/** Variable 的名称、状态配方与可选根值、注册配置；状态回调接收创建时的原始来源。 */
export interface VariableOptions<Source extends VariableSource = VariableSource> {
  name: string
  states?: Record<string, ValueInput | ((source: Source) => ValueInput)>
  root?: { value: ValueInput; dark?: ValueInput; reducedMotion?: ValueInput }
  registration?: { syntax: string; inherits: boolean; initialValue?: ValueInput }
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
/** 排除同样可调用的 Variable Cluster 与 CSS Function，只识别普通 source 函数。 */
export function isVariableSourceFunction(input: VariableSource): input is () => ValueInput {
  return typeof input === 'function' && !isVariable(input) && !isCSSContent(input)
}
/** 创建定义；回调只在创建时求值，收到原始首参数。 */
export function variable<Source extends VariableSource>(source: Source, options: VariableOptions<NoInfer<Source>>): Variable {
  const reference: Variable = { kind: 'variable', name: options.name.replace(/^--/, '') }
  const states = new Map<string, ValueInput>()
  for (const [name, content] of Object.entries(options.states ?? {})) {
    states.set(name, typeof content === 'function' && !isVariable(content) && !isCSSContent(content)
      ? content(source) : content as ValueInput)
  }
  definitions.set(reference, { source, states })
  if (options.registration || options.root) {
    reference.onActive = () => {
      const rules: Rules = []
      const registration = options.registration
      if (registration) {
        const body: Rules = [
          [undefined, 'syntax', JSON.stringify(registration.syntax)],
          [undefined, 'inherits', String(registration.inherits)],
        ]
        if (registration.initialValue !== undefined) body.push([undefined, 'initial-value', registration.initialValue])
        rules.push([[condition(`@property --${reference.name}`)], undefined, body])
      }
      const root = options.root
      if (root) {
        rules.push([[condition(':where(:root)')], reference, root.value])
        if (root.dark !== undefined) rules.push([[condition(':where(:root)'), condition('&:where([data-theme="dark"])')], reference, root.dark])
        if (root.reducedMotion !== undefined) rules.push([[condition(':where(:root)'), media('(prefers-reduced-motion: reduce)'), condition('&')], reference, root.reducedMotion])
      }
      return rules
    }
  }
  return reference
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
