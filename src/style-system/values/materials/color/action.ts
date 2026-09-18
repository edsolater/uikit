/** 引用基础 CSS token 的实心动作配色及交互取值，使用前须加载基础颜色样式。 */
import { variable } from '../../../core/css-variable'
import { value } from '../../../core/css-value'

/** 实心动作底色。 */
export const action = variable('color-action')

/** 动作悬停底色，沿用基础 token 的主题与品牌派生。 */
export const actionHover = variable('color-action-hover')

/** 动作按下底色。 */
export const actionActive = variable('color-action-active')

/** 实心动作的焦点边界色。 */
export const actionLine = variable('color-action-line')

/** 动作底色对应的文字色。 */
export const actionForeground = variable('color-action-fg')

/** 可覆盖的实心动作底色配方；default、hover 与 active 分别拥有可局部重定义的 Variable Key。 */
export const actionSurface = variable('color-action-background', {
  fallback: value(action, {
    hover: actionHover,
    active: actionActive,
  }),
  registration: { syntax: '*', inherits: true }
})
