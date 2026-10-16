/** Variable 创建参数的统一入口。

把默认值、状态值简写和名称简写整理为一份创建配置。

后续创建逻辑只处理统一配置，不再区分调用写法。
*/
import { containKey, isString } from '@edsolater/fnkit'
import { allocateVariableName } from '../key'
import type { VariableDefaultValue, VariableOptions, VariableStateRule } from './core'

/** default 是默认内容，其余自身可枚举字段是状态内容；默认生产函数仍保留原样。 */
export type VariableStateValues<DefaultValue extends VariableDefaultValue = VariableDefaultValue> = {
  default: DefaultValue
} & Record<string, VariableStateRule>

/** 解析后的创建配置；状态回调和默认生产函数尚未执行。 */
export type VariableConfig<
  DefaultValue extends VariableDefaultValue = VariableDefaultValue,
> = VariableOptions & { defaultValue: DefaultValue; name: string; priority: number }

/**
 * 将两处独立简写展开为创建配置，不执行内容函数。
 * 带 default 字段的对象表示状态值，字段判断沿用 fnkit 的 containKey。
 * 第二参数的字符串表示 name；options.states 覆盖简写中的同名状态，其余状态保留。
 * extend-only 沿用来源默认内容，名称与原始状态规则一起继承；不执行任何内容函数。
 * @example parseVariableArgs({ default: 1, hover: 2 }, 'amount')
 * 返回 { defaultValue: 1, states: { hover: 2 }, name: 'amount' }。
 */
export function parseVariableArgs<DefaultValue extends VariableDefaultValue>(
  input: DefaultValue | VariableStateValues<DefaultValue>,
  options?: string | VariableOptions,
): VariableConfig<DefaultValue> {
  const inherited = options === undefined && containKey(input, 'extend')
  const config: VariableOptions = inherited ? input as VariableOptions : isString(options) ? { name: options } : options ?? {}
  const source = config.extend
  const name = allocateVariableName(config.name ?? source?.name)
  const priority = config.priority ?? (source ? source.priority + 1 : 0)
  const shorthand = !inherited && containKey(input, 'default') ? input as VariableStateValues<DefaultValue> : undefined
  const defaultValue = inherited ? source!.config.defaultValue as DefaultValue : shorthand ? shorthand.default : input as DefaultValue
  const sourceStates = source ? Object.fromEntries([...source.config.states].map(([state, rule]) => [state.name, rule])) : undefined
  const inputStates = shorthand ? Object.fromEntries(Object.entries(shorthand).filter(([name]) => name !== 'default')) : undefined
  const states = sourceStates || inputStates || config.states ? { ...sourceStates, ...inputStates, ...config.states } : undefined
  return { ...config, name, priority, defaultValue, ...(states ? { states } : {}) }
}
