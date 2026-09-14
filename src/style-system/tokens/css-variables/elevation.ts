/** 随主题改变阴影色的高度材料。 */
import { joinValues } from '../../core/css-value'
import { shadowColors, shadowShapes } from '../values/elevation'
import { token } from '../token'

/** 随明暗主题切换的阴影颜色。 */
const shadowColor = token('color-shadow', shadowColors.light, { dark: shadowColors.dark })

/** 高度感阶梯：平面无阴影，低层贴近表面，抬升层使用双重阴影。 */
export const shadows = {
  flat: token('shadow-0', 'none'),
  low: token('shadow-1', joinValues(' ', shadowShapes.contact, shadowColor)),
  raised: token(
    'shadow-2',
    joinValues(
      ', ',
      joinValues(' ', shadowShapes.contact, shadowColors.contact),
      joinValues(' ', shadowShapes.raised, shadowColor),
    ),
  ),
}
