/** CSS 变量及其按需定义。 */
import { condition, media } from './css-condition'
import type { Rules } from './css-rule'
import type { Valuable } from './css-valuable'
import type { ValueInput } from './css-value'

/** 可引用、可赋值的 CSS 变量。 */
export interface Variable extends Valuable {
  kind: 'variable'
  name: string
  fallback?: ValueInput
}

/** 变量的根值、引用缺省值与 CSS 注册。 */
export interface VariableOptions {
  root?: {
    value: ValueInput
    dark?: ValueInput
    reducedMotion?: ValueInput
  }
  fallback?: ValueInput
  registration?: {
    syntax: string
    inherits: boolean
    initialValue?: ValueInput
  }
}

/** 变量的局部分支；undefined 名称表示默认赋值。 */
export type VariableOverrides = [condition: string | undefined, value: ValueInput][]

/** 完整赋值或局部分支。 */
export type VariableInput = ValueInput | VariableOverrides

/** 识别 CSS 变量。 */
export function isVariable(input: unknown): input is Variable {
  return input !== null && typeof input === 'object' && 'kind' in input && input.kind === 'variable'
}

/** 创建变量；根值与注册在使用时生效。 */
export function variable(name: string, options?: VariableOptions): Variable {
  const bareName = name.replace(/^--/, '')
  const reference: Variable = { kind: 'variable', name: bareName, fallback: options?.fallback }
  if (options?.registration || options?.root) {
    reference.onActive = () => {
      const rules: Rules = []
      const registration = options.registration
      if (registration) {
        const body: Rules = [
          [undefined, 'syntax', JSON.stringify(registration.syntax)],
          [undefined, 'inherits', String(registration.inherits)],
        ]
        if (registration.initialValue !== undefined) body.push([undefined, 'initial-value', registration.initialValue])
        rules.push([[condition(`@property --${bareName}`)], undefined, body])
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
