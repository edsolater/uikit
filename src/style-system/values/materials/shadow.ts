/** 预定义阴影与交互配方，阴影颜色随明暗主题切换。 */
import { type ShadowShape, shadowValue } from '../shadow'
import { valueList } from '../list'
import { value } from '../../core/css-value'
import { variable } from '../../core/css-variable'
import { whenHover, whenActive, whenDisabled } from '../../selectors/msic'

/** 贴近表面的阴影几何：水平偏移、垂直偏移、模糊半径，长度单位为像素。 */
export const contactShadowShape: ShadowShape = { x: value(0), y: value('1px'), blur: value('2px') }

/** 抬升层阴影几何，偏移与模糊范围大于接触层，长度单位为像素。 */
export const raisedShadowShape: ShadowShape = { x: value(0), y: value('6px'), blur: value('18px') }

/** 亮色主题的阴影色。 */
export const lightShadowColor = value('rgb(0 0 0 / 4%)')

/** 暗色主题阴影色。 */
export const darkShadowColor = value('rgb(0 0 0 / 38%)')

/** 双重阴影中贴近表面的接触色。 */
export const contactShadowColor = value('rgb(0 0 0 / 3%)')

/** 随明暗主题切换的阴影颜色。 */
const shadowColor = variable('color-shadow', { root: { value: lightShadowColor, dark: darkShadowColor } })

/** 平面档，不产生阴影。 */
export const flatShadow = variable('shadow-0', { root: { value: 'none' } })

/** 贴近表面的低层阴影。 */
export const lowShadow = variable('shadow-1', {
  root: { value: shadowValue({ ...contactShadowShape, color: shadowColor }) },
})

/** 抬升档，组合接触与扩散两层阴影。 */
export const raisedShadow = variable('shadow-2', {
  root: {
    value: valueList(
      shadowValue({ ...contactShadowShape, color: contactShadowColor }),
      shadowValue({ ...raisedShadowShape, color: shadowColor }),
    ),
  },
})

/** 可覆盖的阴影配方；default、hover、active 与 disabled 分别拥有可局部重定义的 Variable Key。 */
export const normalShadow = variable('component-shadow', {
  fallback: value(lowShadow, [[whenHover, raisedShadow], [whenActive, flatShadow], [whenDisabled, flatShadow]]),
})
