/** 可按 Condition 重定义的 CSS Variable。 */
import { condition, media, type Condition, type ConditionPath } from './css-condition'
import type { Rules } from './css-rule'
import type { Value, ValueInput } from './css-value'

/** 同时作为 Value 与 Custom Property Key 的逻辑 Variable。 */
export type Variable = Extract<Value, { kind: 'value' }> & {
  name: string
  expression: { type: 'variable'; name: string; fallback?: ValueInput }
}

/** Variable 配置；根值与注册仅在 Variable 被消费时进入本次编译。 */
export interface VariableOptions {
  /** 根作用域值。 */
  root?: {
    value: ValueInput
    /** `[data-theme="dark"]` 覆盖。 */
    dark?: ValueInput
    /** 减少动效覆盖。 */
    reducedMotion?: ValueInput
  }
  /** 默认读取及可重定义的 Condition Value。 */
  fallback?: ValueInput
  /** `@property` 配置。 */
  registration?: {
    syntax: string
    inherits: boolean
    initialValue?: ValueInput
  }
}

/** 按 Condition 局部重定义 Variable。 */
export type VariableOverrides = [condition: Condition | Condition[] | undefined, value: ValueInput][]

/** Variable 的完整值或局部覆盖。 */
export type VariableInput = ValueInput | VariableOverrides

/** 判断输入是否是逻辑 Variable。 */
export function isVariable(input: unknown): input is Variable {
  const expression = input !== null && typeof input === 'object' && 'expression' in input
    ? input.expression as { type?: unknown } | undefined
    : undefined
  return input !== null && typeof input === 'object'
    && 'kind' in input && input.kind === 'value'
    && 'name' in input && typeof input.name === 'string'
    && expression?.type === 'variable'
}

/** 按 Condition header 生成无碰撞的 Custom Property 名。 */
export function variableName(name: string, path: ConditionPath): string {
  const baseName = name.replace(/^--/, '')
  if (path.length === 0) return baseName
  const suffix = path.map((item) => Array.from(item.header, (character) => character.codePointAt(0)!.toString(16)).join('-'))
  return `${baseName}-${suffix.map((name) => `when-${name}`).join('-')}`
}

/** 创建逻辑 Variable；创建时不登记，编译消费时提供根值与注册。 */
export function variable(name: string, options?: VariableOptions): Variable {
  const bareName = name.replace(/^--/, '')
  const reference: Variable = {
    kind: 'value',
    name: bareName,
    expression: { type: 'variable', name: bareName, fallback: options?.fallback },
  }
  if (options?.registration || options?.root) {
    reference.onActive = () => {
      const rules: Rules = new Map()
      const registration = options.registration
      if (registration) {
        const path = [condition(`@property --${bareName}`)]
        rules.set([path, 'syntax'], JSON.stringify(registration.syntax))
        rules.set([path, 'inherits'], String(registration.inherits))
        if (registration.initialValue !== undefined) rules.set([path, 'initial-value'], registration.initialValue)
      }
      const root = options.root
      if (root) {
        rules.set([[condition(':where(:root)')], reference], root.value)
        if (root.dark !== undefined) rules.set([[condition(':where(:root)'), condition('&:where([data-theme="dark"])')], reference], root.dark)
        if (root.reducedMotion !== undefined) rules.set([[condition(':where(:root)'), media('(prefers-reduced-motion: reduce)'), condition('&')], reference], root.reducedMotion)
      }
      return rules
    }
  }
  return reference
}
