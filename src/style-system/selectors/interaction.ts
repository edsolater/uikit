/** 交互状态 Condition。 */
import { condition } from '../core/css-condition'

/** 鼠标悬停。 */
export const hover = condition('&:hover')

/** 正在按下。 */
export const active = condition('&:active')

/** 获得焦点。 */
export const whenFocus = condition('&:focus')

/** 自身或后代获得焦点。 */
export const whenFocusWithin = condition('&:focus-within')

/** 浏览器显示焦点提示。 */
export const whenFocusVisible = condition('&:focus-visible')

/** 原生禁用。 */
export const disabled = condition('&:disabled')

/** 原生或 UIKit 禁用。 */
export const whenDisabled = condition('&:is(:disabled, [data-status~="disabled"])')

/** 未禁用时悬停。 */
export const whenHover = condition('&:where(:hover):not(:disabled, [data-status~="disabled"])')

/** 未禁用时按下。 */
export const whenActive = condition('&:where(:active):not(:disabled, [data-status~="disabled"])')
