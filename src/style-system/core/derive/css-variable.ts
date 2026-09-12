/** 使用统一 Block 表达变量引用与状态派生。 */
import { block, isBlock } from '../css-block'
import type { Value } from './css-value'

/** 变量引用形式的 Value，保存名称和兜底值，最终表达为 var 引用。 */
export interface Variable extends Value {
  kind: 'variable'
  name: string
  defaultValue?: Value
}

/** 构造延迟变量引用，不执行浏览器注册。
 * @example
 * const foreground = variable('foreground', value('blue'))
 */
export function variable(name: string, defaultValue?: Value): Variable {
  return block({ kind: 'variable' as 'variable', name, defaultValue }, {
    /** 从当前兜底值字段取得依赖。 */
    getDependencies() { return this.defaultValue ? [this.defaultValue] : [] },
    /** 在最终输出时解析名称和兜底值。 */
    parseCss() { return this.defaultValue ? `var(--${this.name}, ${this.defaultValue.parseCss()})` : `var(--${this.name})` },
  })
}

/** 默认值及状态后缀变量的构造材料，不代表已向浏览器注册。 */
interface StateVariableRegisterOption {
  type?: string
  name: string
  value:
    | Value
    // 智能变量时，为应对不同状态，自动使用不同的值
    | (Partial<Record<VariableStates, Value>> & {
        default: Value
      })
}

/** 默认变量及按状态名取得的派生变量集合。 */
type StateVariable<Status extends string> = { [status in Status]: Variable } & Variable

/** 从状态值映射中取得派生名称，单个值不产生状态名称。 */
type GetStatesFromVariableOptions<O> = O extends { value: { [status: string]: Value } } ? keyof O['value'] : never

/** 构造默认及状态后缀的变量定义；当前不执行浏览器注册。
 * @example
 * const color = registerVariable({ name: 'surface', value: { default: variable('base'), hover: variable('raised') } })
 */
export function registerVariable<O extends StateVariableRegisterOption>({
  name,
  value,
}: O): StateVariable<Extract<GetStatesFromVariableOptions<O>, string>> {
  const variableDefaultValue = isBlock(value) ? value : value.default
  const reference = variable(name, variableDefaultValue)

  if (!isBlock(value))
    for (const status in value) {
      if (status === 'default') continue
      reference[status] = variable(`${name}-${status}`, (value as any)[status])
    }

  return reference as StateVariable<Extract<GetStatesFromVariableOptions<O>, string>>
}

const states = {
  // 普通，兜底状态、默认状态
  'default': '',
  // 鼠标悬浮时，CSS伪类:hover
  'hover': ':hover',
  // 按下时，CSS伪类:active
  'active': ':active',
  // 获得焦点时，CSS伪类:focus-within
  'focus-within': ':focus-within',

  // 按钮禁用，CSS伪类:disabled
  'disabled': ':disabled',
  // 禁用：错误，自定义状态[data-status~="error"]，一般用于表单组件
  'status:error': '[data-status~="error"]',
  // 禁用：加载中,自定义状态[data-status~="loading"]，一般用于表单组件
  'status:loading': '[data-status~="loading"]',
} as const

/** 当前支持的默认、伪类与自定义状态名称。 */
type VariableStates = keyof typeof states
