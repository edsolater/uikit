/** 可在不同组件中复用的相对交互条件。 */
import { styleRule } from '../core/css-block/style'

/** 鼠标悬停条件。 */
export const hover = styleRule('&:hover')

/** 正在按下的条件。 */
export const active = styleRule('&:active')

/** 浏览器判定需要显示焦点提示时生效。 */
export const focusVisible = styleRule('&:focus-visible')

/** 原生控件的禁用条件，不包含自定义状态标记。 */
export const disabled = styleRule('&:disabled')

/** 状态本身不增加优先级；禁用的原生控件不响应。 */
export const enabledHover = styleRule('&:where(:hover):not(:disabled)')

/** 按下反馈排除原生禁用控件；按下条件本身不增加优先级。 */
export const enabledActive = styleRule('&:where(:active):not(:disabled)')
