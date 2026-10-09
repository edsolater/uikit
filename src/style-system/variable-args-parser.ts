/** Variable 创建参数的统一入口。

把默认值、状态值简写和名称简写整理为一份创建配置。

后续创建逻辑只处理统一配置，不再区分调用写法。
*/
import { containKey, isString } from '@edsolater/fnkit'
import { allocateVariableName } from './key'
import type { VariableDefaultValue, VariableOptions } from './variable'
import type { ValueInput } from './value'

/** default 是默认内容，其余自身可枚举字段是状态内容；默认生产函数仍保留原样。 */
export type VariableStateValues<DefaultValue extends VariableDefaultValue = VariableDefaultValue> = {
  default: DefaultValue
} & Record<string, ValueInput | ((defaultValue: DefaultValue) => ValueInput)>

/** 解析后的创建配置；状态回调和默认生产函数尚未执行。 */
export type VariableConfig<
  DefaultValue extends VariableDefaultValue = VariableDefaultValue,
> = VariableOptions<DefaultValue> & { defaultValue: DefaultValue; name: string }

/**
 * 将两处独立简写展开为创建配置，不执行内容函数。
 * 带 default 字段的对象表示状态值，字段判断沿用 fnkit 的 containKey。
 * 第二参数的字符串表示 name；options.states 覆盖简写中的同名状态，其余状态保留。
 * 名称省略或为 undefined 时分配 temp-1、temp-2 等临时名称；显式名称不占用序号。
 * @example parseVariableArgs({ default: 1, hover: 2 }, 'amount')
 * 返回 { defaultValue: 1, states: { hover: 2 }, name: 'amount' }。
 */
export function parseVariableArgs<DefaultValue extends VariableDefaultValue>(
  input: DefaultValue | VariableStateValues<DefaultValue>,
  options?: string | VariableOptions<NoInfer<DefaultValue>>,
): VariableConfig<DefaultValue> {
  const config = isString(options) ? { name: options } : options ?? {}
  const name = allocateVariableName(config.name)
  if (containKey(input, 'default')) {
    const { default: defaultValue, ...states } = input as VariableStateValues<DefaultValue>
    return { ...config, name, defaultValue, states: { ...states, ...config.states } }
  }
  return { ...config, name, defaultValue: input }
}
