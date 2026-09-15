/** 可复用的选择条件，不持有内容，也不创建共享的 Block 状态。 */

/** 鼠标悬停条件。 */
export const hover = '&:hover'

/** 正在按下的条件。 */
export const active = '&:active'

/** 浏览器判定需要显示焦点提示时生效。 */
export const focusVisible = '&:focus-visible'

/** 原生控件的禁用条件，不包含自定义状态标记。 */
export const disabled = '&:disabled'

/** 悬停反馈排除原生禁用控件；悬停条件本身不增加优先级。 */
export const stateHover = '&:where(:hover):not(:disabled)'

/** 按下反馈排除原生禁用控件；按下条件本身不增加优先级。 */
export const stateActive = '&:where(:active):not(:disabled)'
