/** Variable 创建参数的统一入口。

把默认值、状态值简写和名称简写整理为一份创建配置，并为 Variable 与 Modification 共用的 CSS 名称分配避让。

后续创建逻辑只处理统一配置，不再区分调用写法。
*/
import { containKey, IdGenerator, isString } from '@edsolater/fnkit'
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

/** Variable 与 Modification 共用的临时名称序号，仅在缺少名称时分配。 */
const nameGenerator = new IdGenerator('temp')
/** 已用于变量或变化声明的名称；自动分配避让显式名称，显式同名仍允许 CSS 局部覆盖。 */
const usedNames = new Set<string>()

/**
 * 分配同一 CSS 自定义属性命名空间中的名称；匿名名称避让已登记的显式名称。
 * 显式同名保留，用于 CSS 局部覆盖；返回名称保留调用者传入的 -- 前缀。
 */
export function allocateVariableName(name?: string): string {
  if (name === undefined) {
    do { name = `temp-${nameGenerator.genID()}` } while (usedNames.has(name))
  }
  usedNames.add(name.replace(/^--/, ''))
  return name
}

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
  if (isStateValues(input)) {
    const { default: defaultValue, ...states } = input
    return { ...config, name, defaultValue, states: { ...states, ...config.states } }
  }
  return { ...config, name, defaultValue: input }
}

/**
 * 按 fnkit 的字段存在性协议识别状态值简写。
 */
const isStateValues = <DefaultValue extends VariableDefaultValue>(
  input: DefaultValue | VariableStateValues<DefaultValue>,
): input is VariableStateValues<DefaultValue> =>
  containKey(input, 'default')
