import { cssColorMix } from './css-web-utils'
import { cssValue, isCssValue, type CssValue } from './css-value'
import { cssRule } from './css-rule'
import { cssDeclarations, type CSSDeclarations } from './css-declararion'
import { containKey, isObject } from '@edsolater/fnkit'

type CssVariable = {
  name: string
  defaultValue?: CssValue
  cssString: () => CssValue
}

/** 一个已注册的裸css变量 */
function cssVariable(name: string, defaultValue?: CssValue): CssVariable {
  const cssString = defaultValue ? cssValue(`var(--${name}, ${defaultValue})`) : cssValue(`var(--${name})`)
  return {
    name,
    defaultValue,
    cssString: () => cssString,
  }
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

/** 代表 任意组件 的 表面颜色（纯粹印象的主体色） */
export const surfaceColor = registCssVariable({
  type: 'color',
  name: 'surface-color',
  value: {
    default: cssVariable('dye-neutral-1'),
    hover: cssVariable('dye-neutral-2'),
    active: cssVariable('dye-neutral-3'),
  },
})

export const bgColor = registCssVariable({
  type: 'color',
  name: 'bg',
  value: {
    default: cssColorMix([cssVariable('surface-color'), 0.82], cssVariable('color-accent-soft')),
    hover: cssColorMix([cssVariable('surface-color-hover'), 0.72], cssVariable('color-accent-soft')),
    active: cssColorMix([cssVariable('surface-color-active'), 0.62], cssVariable('color-accent-soft')),
  },
})

export const fgColor = registCssVariable({
  type: 'color',
  name: 'fg',
  value: {
    default: cssVariable('color-fg'), // TODO: 这里还不对，需要确认用什么颜色,但此时修改 api
    hover: cssVariable('color-fg-strong'),
    active: cssVariable('color-fg-strong'),
  },
})
