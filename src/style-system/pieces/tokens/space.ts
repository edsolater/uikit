/** 间距基准及相对尺寸状态。 */
import { token } from '../../token'
import { multiply } from '../functions/calc'
import { whenSmall, whenLarge, whenXlarge } from '../conditions/profile'

/** 每个状态相对于所选部分的基准计算，不保存另一套绝对档位。 */
export const baseSpace = token('8px', {
  name: 'base-space',
  address: ':root',
  state: [
    [whenSmall, (base) => multiply(base, 1 / 2)],
    [whenLarge, (base) => multiply(base, 4 / 3)],
    [whenXlarge, (base) => multiply(base, 2)],
  ],
})

/** 视口宽度在 360px 至 1440px 区间的进度。 */
export const fluidProgress = token('progress(100vw, 360px, 1440px)', {
  name: 'fluid-progress',
  address: ':root',
})
