/** 使用统一 Block 表达变量引用与状态派生。 */
import { cssBlock, isCssBlock, type CssBlock } from './css-block'
import { containKey } from '@edsolater/fnkit'

interface CssVariable extends CssBlock {
  name: string
  defaultValue?: CssBlock
}

/** 构造延迟变量引用，不执行浏览器注册。 */
export function cssVariable(name: string, defaultValue?: CssBlock): CssVariable {
  const newCssBlock = cssBlock(
    () => defaultValue ? `var(--${name}, ${defaultValue})` : `var(--${name})`,
    { dependence: defaultValue ? [defaultValue] : [] },
  ) as CssVariable
  newCssBlock.name = name
  newCssBlock.defaultValue = defaultValue
  return newCssBlock
}

/**
 * 判定 一个值是否为一个已注册的裸css变量
 */
function isCssVariable(value: unknown): value is CssVariable {
  return isCssBlock(value) && containKey(value, 'name')
}

/** 注册 “智能（状态自适应）css变量” 时的选项 */
interface CssStateVariableRegisterOption {
  type?: string
  name: string
  value:
    | CssBlock
    // 智能变量时，为应对不同状态，自动使用不同的值
    | (Partial<Record<CssVariableStates, CssBlock>> & {
        default: CssBlock
      })
}

type CssStateVariable<Status extends string> = { [status in Status]: CssVariable } & CssVariable

type GetStatesFromCssVariableOptions<O> = O extends { value: { [status: string]: CssBlock } } ? keyof O['value'] : never

/** 
 * 注册[此处] --> （定义） --> 使用
 * 1. 通过 {@link registCssVariable} 注册 cssVariable
 * 2. 通过 cssVairiable.declare 在具体的cssRules 中定义 cssVariable 的当前值
 * 3. 通过 在cssBlock 中使用 cssVariable 直接使用

 * 注册 CSS 变量,以及它的派生（可选，stateVariable）。方便管理css变量，但不直接使用 */
export function registCssVariable({
  name,
  value,
}: CssStateVariableRegisterOption): CssStateVariable<GetStatesFromCssVariableOptions<CssStateVariableRegisterOption>> {
  const variableDefaultValue = isCssBlock(value) ? value : value.default
  const selfCssVariable = cssVariable(name, variableDefaultValue)

  if (!isCssBlock(value))
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
