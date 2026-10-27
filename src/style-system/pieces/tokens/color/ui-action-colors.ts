/** 表面混合强度与品牌高亮材料。 */
import { token } from '../../../token'
import { add, multiply } from '../../functions/calc'
import { oklch } from '../../functions/oklch'
import { brandColor } from './brand-color'

/** 动作色混入承载面的占比；状态相对于组件实际选定的基础占比。 */
export const surfaceStrength = token(0.18, {
  name: 'surface-strength',
  state: {
    hover: (base) => multiply(base, 0.28 / 0.18),
    active: (base) => multiply(base, 0.38 / 0.18),
  },
})

/** 高亮色在当前品牌颜色上增加明度和彩度，并将色相偏移 -18°。 */
export const highlightColor = token(
  oklch(brandColor, {
    lightness: (current) => add(current, 0.04),
    chroma: (current) => add(current, 0.01),
    hue: (current) => add(current, -18),
  }),
  'highlight-color',
)
