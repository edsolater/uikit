import { cssValue, isCssValue, type CssValue } from './css-value'
import { containKey, isObject } from '@edsolater/fnkit'

interface CssVariable extends CssValue {
  name: string
  defaultValue?: CssValue
}

/** 一个已注册的裸css变量 */
export function cssVariable(name: string, defaultValue?: CssValue): CssVariable {
  const cssString = defaultValue ? cssValue(`var(--${name}, ${defaultValue})`) : cssValue(`var(--${name})`)
  const newCssValue = cssValue(cssString) as CssVariable
  newCssValue.name = name
  newCssValue.defaultValue = defaultValue
  return newCssValue
}

/**
 * 判定 一个值是否为一个已注册的裸css变量
 */
function isCssVariable(value: unknown): value is CssVariable {
  return isCssValue(value) && containKey(value, 'name')
}

/** 注册 “智能（状态自适应）css变量” 时的选项 */
interface CssStateVariableRegisterOption {
  type?: string
  name: string
  value:
    | CssValue
    // 智能变量时，为应对不同状态，自动使用不同的值
    | (Partial<Record<CssVariableStates, CssValue>> & {
        default: CssValue
      })
}

type CssStateVariable<Status extends string> = { [status in Status]: CssVariable } & CssVariable

type GetStatesFromCssVariableOptions<O> = O extends { value: { [status: string]: CssValue } } ? keyof O['value'] : never

/** 
 * 注册[此处] --> （定义） --> 使用
 * 1. 通过 {@link registCssVariable} 注册 cssVariable
 * 2. 通过 cssVairiable.declare 在具体的cssRules 中定义 cssVariable 的当前值
 * 3. 通过 在cssValue 中使用 cssVariable 直接使用

 * 注册 CSS 变量,以及它的派生（可选，stateVariable）。方便管理css变量，但不直接使用 */
export function registCssVariable({
  name,
  value,
}: CssStateVariableRegisterOption): CssStateVariable<GetStatesFromCssVariableOptions<CssStateVariableRegisterOption>> {
  const variableDefaultValue = isCssValue(value) ? value : value.default
  const selfCssVariable = cssVariable(name, variableDefaultValue)

  if (isObject(value))
    for (const status in value) {
      if (status === 'default') continue
      selfCssVariable[status] = cssVariable(`${name}-${status}`, (value as any)[status])
    }

  return selfCssVariable
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

type CssVariableStates = keyof typeof states
