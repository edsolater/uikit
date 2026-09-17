/** 提供可覆盖的文字前景色，并在定义处保存 hover、active 与 disabled 的完整取值。 */
import { variable } from '../../core/css-variable'
import { value } from '../../core/css-value'
import { whenHover, whenActive, whenDisabled } from '../../selectors/msic'
import { ink, strongInk } from './color-palette'

/** 普通文字色。 */
export const foreground = variable('color-foreground', { root: { value: ink } })

/** 强调文字色。 */
export const strongForeground = variable('color-foreground-strong', { root: { value: strongInk } })

/** 可覆盖的内容颜色配方；default、hover、active 与 disabled 分别拥有 Variable Key，交互态默认采用强调文字色。 */
export const color = variable('color-content', {
  fallback: value(foreground, [
    [whenHover, strongForeground],
    [whenActive, strongForeground],
    [whenDisabled, foreground],
  ]),
  registration: { syntax: '*', inherits: true }
})
