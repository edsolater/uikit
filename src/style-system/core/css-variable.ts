/** 为一套 Value 提供稳定 CSS Custom Property 地址，使业务 Rule 可按已有 Condition 局部重定义。 */
import { condition, media, type ConditionPath } from './css-condition'
import { declaration, type Declaration } from './css-declaration'
import type { Rules } from './css-rule'
import type { Value, ValueInput } from './css-value'

/**
 * 可在普通 Value 位置读取、也可在属性位置被重定义的逻辑 CSS Variable。
 * fallback 中的每个 Condition 会变成独立 Custom Property，例如 hover 使用 `--name-when-hover`。
 */
export type Variable = Extract<Value, { kind: 'value' }> & {
  name: string
  expression: { type: 'variable'; name: string; fallback?: ValueInput }
}

/** 定义逻辑 Variable 的默认取值、根作用域值及可选 `@property` 注册；这些内容只在 Variable 被编译访问时进入结果。 */
export interface VariableOptions {
  /** 变量激活后生成根作用域赋值及显式提供的条件覆盖。 */
  root?: {
    value: ValueInput
    /** 根元素具有 [data-theme="dark"] 时覆盖，不使用 prefers-color-scheme。 */
    dark?: ValueInput
    /** 媒体条件 prefers-reduced-motion: reduce 成立时覆盖根值。 */
    reducedMotion?: ValueInput
  }
  /** 局部未重定义时使用的 Value；它拥有的 Condition 同时定义可重定义 Key。 */
  fallback?: ValueInput
  /** 需要浏览器显式注册的 Custom Property 语法、继承性与可选初值。 */
  registration?: {
    syntax: string
    inherits: boolean
    initialValue?: ValueInput
  }
}

/** 判断 Value 是否是可用于属性位置的逻辑 CSS Variable。 */
export function isVariable(input: unknown): input is Variable {
  const expression = input !== null && typeof input === 'object' && 'expression' in input
    ? input.expression as { type?: unknown } | undefined
    : undefined
  return input !== null && typeof input === 'object'
    && 'kind' in input && input.kind === 'value'
    && 'name' in input && typeof input.name === 'string'
    && expression?.type === 'variable'
}

/**
 * 把 Condition Path 编码成声明对象使用的 Key；default 表示空路径，其余部分使用稳定的 Condition name。
 * @example
 * variableConditionKey([]) // 'default'
 * variableConditionKey([condition('&:hover', 'hover')]) // 'hover'
 */
export function variableConditionKey(path: ConditionPath): string {
  return path.length === 0 ? 'default' : path.map((item) => item.name).join('.')
}

/**
 * 为逻辑 Variable 的一个 Condition Key 生成落盘名称；普通状态保持可读，其他 Condition name 转成稳定十六进制片段。
 * @example
 * variableName('bg-color', []) // 'bg-color'
 * variableName('bg-color', [condition('&:hover', 'hover')]) // 'bg-color-when-hover'
 */
export function variableName(name: string, path: ConditionPath): string {
  const baseName = name.replace(/^--/, '')
  if (path.length === 0) return baseName
  const suffix = path.map((item) => Array.from(item.name, (character) => /[a-zA-Z0-9_-]/.test(character)
    ? character
    : `-${character.codePointAt(0)!.toString(16)}-`).join(''))
  return `${baseName}-${suffix.map((name) => `when-${name}`).join('-')}`
}

/**
 * 创建既可充当声明属性、又可作为 var() 引用的逻辑 Variable；name 接受带或不带 -- 的名称。
 * fallback 的 Condition 决定可读取和重定义的 Key；各 Key 编译为独立 Custom Property。root 与 registration 在访问时提供。
 * @example
 * const background = variable('--background', {
 *   fallback: value('red', [[condition('&:hover', 'hover'), 'blue']]),
 * })
 * // 默认读取 var(--background, red)，hover 读取 var(--background-when-hover, blue)。
 * declareVariable(background, { hover: 'cyan' }) // 保存 --background-when-hover: cyan，尚未登记。
 */
export function variable(name: string, options?: VariableOptions): Variable {
  const bareName = name.replace(/^--/, '')
  const reference: Variable = {
    kind: 'value',
    name: bareName,
    expression: { type: 'variable', name: bareName, fallback: options?.fallback },
  }
  if (options?.registration || options?.root) {
    /**
     * 为当前变量的基础名称生成 @property，并把根作用域赋值交回编译器处理；不写 CSSRoot 的源账本。
     * 深色和减少动效的覆盖只在 options 显式提供时生成，值保留给编译器继续解读。
     * @example
     * // options 为 { root: { value: 'red', dark: 'blue' } }：
     * reference.onActive(context) // 返回根作用域 red、深色根作用域 blue 两条 Rules。
     */
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

/**
 * 保存一次局部重定义；编译时只输出 input 明确提供、且 reference 原本拥有的 Condition Key。
 * RawValue 只重定义 default；对象按 Condition name 选择 Key；未匹配 Key 忽略，不比较新旧值。
 * @example
 * declareVariable(background, 'red') // 只定义 --background。
 * declareVariable(background, { hover: 'blue' }) // 只定义 --background-when-hover。
 */
export function declareVariable(reference: Variable, input: ValueInput | Record<string, ValueInput>): Declaration<string, unknown> {
  return declaration(reference, input)
}
