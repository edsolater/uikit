/** 随主题改变阴影色的高度材料。 */
import { variable } from '../core/css-variable'
import { joinValues } from '../core/css-value'
import { lightShadowColor, darkShadowColor, contactShadowColor, contactShadowShape, raisedShadowShape } from './shadow-scale'

/** 随明暗主题切换的阴影颜色。 */
const shadowColor = variable('color-shadow', { root: { value: lightShadowColor, dark: darkShadowColor } })

/** 平面档，不产生阴影。 */
export const flatShadow = variable('shadow-0', { root: { value: 'none' } })

/** 贴近表面的低层阴影。 */
export const lowShadow = variable('shadow-1', { root: { value: joinValues(' ', contactShadowShape, shadowColor) } })

/** 抬升档，组合接触与扩散两层阴影。 */
export const raisedShadow = variable('shadow-2', {
  root: {
    value: joinValues(
      ', ',
      joinValues(' ', contactShadowShape, contactShadowColor),
      joinValues(' ', raisedShadowShape, shadowColor),
    ),
  },
})
