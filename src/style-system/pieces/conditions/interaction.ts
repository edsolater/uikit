/** 交互状态 Condition。 */
import { stateCondition } from '../../state-condition'

/** 获得焦点。 */
export const whenFocus = stateCondition('&:focus')

/** 自身或后代获得焦点。 */
export const whenFocusWithin = stateCondition('&:focus-within')

/** 浏览器显示焦点提示。 */
export const whenFocusVisible = stateCondition('&:focus-visible')

/** 原生或 UIKit 禁用。 */
export const whenDisabled = stateCondition(
  '&:is(:disabled, [data-status~="disabled"])',
)

/** 未被原生或 UIKit 状态禁用。 */
export const whenEnabled = stateCondition(
  '&:not(:disabled, [data-status~="disabled"])',
)

/** UIKit 状态集合中包含 loading。 */
export const whenLoading = stateCondition('&[data-status~="loading"]')

/** 当前主体悬停，不隐式排除其他状态。 */
export const whenHover = stateCondition('&:hover')

/** 当前主体按下，不隐式排除其他状态。 */
export const whenActive = stateCondition('&:active')

/**
 * Popover 采用 block 或 inline 翻向时仅匹配后代和伪元素。
 * 容器需设置 container-type: anchored；条件不能查询并修改该容器自身。
 * @example rules(['.PopoverContent', whenPopoverFlip], { color: 'red' })
 */
export const whenPopoverFlip = stateCondition(
  '@container anchored((fallback: flip-block) or (fallback: flip-inline))',
)

/** 交互快捷名；focus 沿用既有的焦点提示含义。 */
export const interactionStateConditions = {
  focus: whenFocusVisible,
  focusWithin: whenFocusWithin,
  focusVisible: whenFocusVisible,
  hover: whenHover,
  active: whenActive,
  disabled: whenDisabled,
  enabled: whenEnabled,
  loading: whenLoading,
}
