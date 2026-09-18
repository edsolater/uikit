/** 预定义阴影与交互配方，阴影颜色随明暗主题切换。 */
import { type ShadowShape, shadowValue } from '../shadow'
import { valueList } from '../list'
import { value } from '../../core/css-value'
import { variable } from '../../core/css-variable'

/** 贴近表面的阴影几何：水平偏移、垂直偏移、模糊半径，长度单位为像素。 */
export const contactShape: ShadowShape = { x: value(0), y: value('1px'), blur: value('2px') }

/** 抬升层阴影几何，偏移与模糊范围大于接触层，长度单位为像素。 */
export const raisedShape: ShadowShape = { x: value(0), y: value('6px'), blur: value('18px') }

/** 亮色主题的阴影色。 */
export const lightShade = value('rgb(0 0 0 / 4%)')

/** 暗色主题阴影色。 */
export const darkShade = value('rgb(0 0 0 / 38%)')

/** 双重阴影中贴近表面的接触色。 */
export const contactShade = value('rgb(0 0 0 / 3%)')

/** 随明暗主题切换的阴影颜色。 */
const shadowShade = variable('color-shadow', { root: { value: lightShade, dark: darkShade } })

/** 平面档，不产生阴影。 */
export const flat = variable('shadow-flat', { root: { value: 'none' } })

/** 贴近表面的低层阴影。 */
export const low = variable('shadow-low', {
  root: { value: shadowValue({ ...contactShape, color: shadowShade }) },
})

/** 抬升档，组合接触与扩散两层阴影。 */
export const raised = variable('shadow-raised', {
  root: {
    value: valueList(
      shadowValue({ ...contactShape, color: contactShade }),
      shadowValue({ ...raisedShape, color: shadowShade }),
    ),
  },
})

/** 可交互主体的层级反馈；悬停时抬升，按下或禁用时回到平面。 */
export const interactiveElevation = value(low, {
  hover: raised,
  active: flat,
  disabled: flat,
})
