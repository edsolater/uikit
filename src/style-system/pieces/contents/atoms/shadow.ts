/** 预定义阴影 Atom 与交互配方；阴影档位引用已加载的基础 CSS token，随主题改变几何与浓度。 */
import { type ShadowShape } from '../atom-creators/shadow'
import { value } from '../../../value'
import { variable } from '../../../variable'

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

/** 平面档，不产生阴影。 */
export const shadowFlat = variable('var(--shadow-0)', { name: 'shadow-flat' })

/** 贴近表面的低层阴影。 */
export const shadowLow = variable('var(--shadow-1)', { name: 'shadow-low' })

/** 抬升档，组合接触与扩散两层阴影。 */
export const shadowRaised = variable('var(--shadow-2)', { name: 'shadow-raised' })

/** 强抬升档，使用基础 token 随主题选择的几何与浓度。 */
export const shadowElevated = variable('var(--shadow-3)', { name: 'shadow-elevated' })

/** 可交互主体的层级反馈；悬停时抬升，按下或禁用时回到平面。 */
export const shadowInteractive = variable(shadowLow, {
  name: 'shadow-interactive', states: {
    hover: shadowRaised,
    active: shadowFlat,
    disabled: shadowFlat,
  }
})
