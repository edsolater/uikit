/** Variable 创建参数的统一入口。

把默认值、状态与变体定义及名称简写整理为一份创建配置，名称统一为 VariableName。

后续创建逻辑只处理统一配置，不再区分调用写法。
*/
import { containKey, isString } from '@edsolater/fnkit'
import { variableName, type VariableName } from './name'
import type { Variable, VariableDefaultValue, VariableOptions, VariableStateRule } from './core'

/** default 是默认内容，其余自身可枚举字段是状态内容；默认生产函数仍保留原样。 */
export type VariableStateValues<DefaultValue extends VariableDefaultValue = VariableDefaultValue> = {
  default: DefaultValue
} & Record<string, VariableStateRule>

/** 解析后的创建配置；状态回调和默认生产函数尚未执行。 */
export type VariableConfig<
  DefaultValue extends VariableDefaultValue = VariableDefaultValue,
> = VariableOptions & { defaultValue: DefaultValue; name: VariableName; priority: number }

/**
 * 将两处独立简写展开为创建配置，不执行内容函数。
 * 带 default 字段的对象表示状态值，字段判断沿用 fnkit 的 containKey。
 * 第二参数的字符串表示 name；options.states 覆盖简写中的同名状态，其余状态保留。
 * variableFrom 替换基础内容，名称与原始状态、变体定义一起继承；不执行内容函数。
 * @example parseVariableArgs({ default: 1, hover: 2 }, 'amount')
 * 默认内容为 1，hover 为 2，name 为绑定 amount 地址的 VariableName。
 */
export function parseVariableArgs<DefaultValue extends VariableDefaultValue>(
  input: DefaultValue | VariableStateValues<DefaultValue>,
  options?: string | VariableOptions,
  source?: Variable,
): VariableConfig<DefaultValue> {
  const overrides: VariableOptions = isString(options) ? { name: options } : options ?? {}
  const config: VariableOptions = {
    name: source?.name, address: source?.address, priority: source?.priority,
    registration: source?.registration, onActive: source?.config.onActive,
    compileWaveIndex: source?.config.compileWaveIndex, ...overrides,
  }
  const inputName = config.name ?? source!.name
  const name = isString(inputName) ? variableName(inputName) : inputName
  const priority = config.priority ?? 0
  const shorthand = containKey(input, 'default') ? input as VariableStateValues<DefaultValue> : undefined
  const defaultValue = shorthand ? shorthand.default : input as DefaultValue
  const sourceStates = source ? Object.fromEntries([...source.config.states].map(([state, rule]) => [state.name, rule])) : undefined
  const inputStates = shorthand ? Object.fromEntries(Object.entries(shorthand).filter(([name]) => name !== 'default')) : undefined
  const states = sourceStates || inputStates || overrides.states ? { ...sourceStates, ...inputStates, ...overrides.states } : undefined
  const variants = source?.config.variants || overrides.variants ? { ...source?.config.variants, ...overrides.variants } : undefined
  return { ...config, address: config.address ?? ':where(:root)', name, priority, defaultValue, states, variants }
}
