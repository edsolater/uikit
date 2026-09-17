/** 可复用的选择条件，作为 Condition Path 的地址部分。 */
import { condition } from '../core/css-condition'

/** 鼠标悬停条件。 */
export const $hover = condition('&:hover', 'hover')

/** 正在按下的条件。 */
export const $active = condition('&:active', 'active')

/** 浏览器判定需要显示焦点提示时生效。 */
export const $focusVisible = condition('&:focus-visible', 'focus-visible')

/** 原生控件的禁用条件，不包含自定义状态标记。 */
export const $disabled = condition('&:disabled', 'disabled')

/** UIKit 禁用反馈同时接受原生属性与 Status 标记。 */
export const whenDisabled = condition('&:is(:disabled, [data-status~="disabled"])', 'disabled')

/** 悬停反馈排除禁用控件；悬停条件本身不增加优先级。 */
export const whenHover = condition('&:where(:hover):not(:disabled, [data-status~="disabled"])', 'hover')

/** 按下反馈排除禁用控件；按下条件本身不增加优先级。 */
export const whenActive = condition('&:where(:active):not(:disabled, [data-status~="disabled"])', 'active')
