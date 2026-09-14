/** 阴影几何与明暗主题的阴影色。 */
import { value } from '../../core/css-value'

/** 接触与抬升阴影的几何形状：水平偏移、垂直偏移、模糊半径。 */
export const shadowShapes = { contact: value('0 1px 2px'), raised: value('0 6px 18px') }

/** 明暗主题阴影色，以及双重阴影中贴近表面的接触色。 */
export const shadowColors = {
  light: value('rgb(0 0 0 / 4%)'),
  dark: value('rgb(0 0 0 / 38%)'),
  contact: value('rgb(0 0 0 / 3%)'),
}
