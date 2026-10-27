/** 环境条件只表达主题标记与用户偏好，不规定材料取值。 */
import { stateCondition } from '../../state-condition'

/** 所在主体带有暗色主题标记。 */
export const whenDarkTheme = stateCondition('&[data-theme="dark"]')

/** 用户偏好减少动效。 */
export const whenReducedMotion = stateCondition(
  '@media (prefers-reduced-motion: reduce)',
)

/** 环境快捷名只对应已有主题标记和媒体条件。 */
export const environmentStateConditions = {
  darkTheme: whenDarkTheme,
  reducedMotion: whenReducedMotion,
}
