/** 交互状态 Condition。 */
import { condition } from '../../condition'

/** 获得焦点。 */
export const whenFocus = condition('&:focus')

/** 自身或后代获得焦点。 */
export const whenFocusWithin = condition('&:focus-within')

/** 浏览器显示焦点提示。 */
export const whenFocusVisible = condition('&:focus-visible')

/** 原生或 UIKit 禁用。 */
export const whenDisabled = condition(
  '&:is(:disabled, [data-status~="disabled"])',
)

/** 未被原生或 UIKit 状态禁用。 */
export const whenEnabled = condition(
  '&:not(:disabled, [data-status~="disabled"])',
)

/** UIKit 状态集合中包含 loading。 */
export const whenLoading = condition('&[data-status~="loading"]')

/** 未禁用时悬停。 */
export const whenHover = condition('&:where(:hover)')

/** 未禁用时按下。 */
export const whenActive = condition('&:where(:active)')
