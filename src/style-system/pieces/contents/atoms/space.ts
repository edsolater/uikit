/** 间距基准、控件尺寸状态，以及间隔和两向内边距的部分配方。 */
import { variable } from '../../../variable'
import { multiply } from '../functions/calc'

/** 每个状态相对于所选部分的基准计算，不保存另一套绝对档位。 */
export const space = variable('8px', {
  name: 'space',
  states: {
    '&[data-size="small"]': base => multiply(base, 1 / 2),
    '&[data-size="large"]': base => multiply(base, 3 / 2),
    '&[data-size="xlarge"]': base => multiply(base, 2),
  },
  variants: {
    gap: base => base,
    paddingBlock: base => ({
      default: base,
      '&[data-size="large"]': current => current,
      '&[data-size="xlarge"]': current => multiply(current, 3 / 2),
    }),
    paddingInline: base => ({
      default: multiply(base, 3),
      '&[data-size="large"]': current => multiply(current, 4 / 3),
    }),
  },
})

/** 视口宽度在 360px 至 1440px 区间的进度。 */
export const fluidProgress = variable('progress(100vw, 360px, 1440px)', 'fluid-progress')
