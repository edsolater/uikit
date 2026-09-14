/** 阴影几何与明暗主题的阴影色。 */
import { value } from '../core/css-value'

/** 贴近表面的阴影几何：水平偏移、垂直偏移、模糊半径，长度单位为像素。 */
export const contactShadowShape = value('0 1px 2px')

/** 抬升层阴影几何，偏移与模糊范围大于接触层，长度单位为像素。 */
export const raisedShadowShape = value('0 6px 18px')

/** 亮色主题的阴影色。 */
export const lightShadowColor = value('rgb(0 0 0 / 4%)')

/** 暗色主题阴影色。 */
export const darkShadowColor = value('rgb(0 0 0 / 38%)')

/** 双重阴影中贴近表面的接触色。 */
export const contactShadowColor = value('rgb(0 0 0 / 3%)')
