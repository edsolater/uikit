/** 间距基准、控件尺寸状态，以及间隔和两向内边距的部分配方。 */
import { token, type Token, type TokenInput } from '../../../token'
import { multiply } from '../functions/calc'

/** 每个状态相对于所选部分的基准计算，不保存另一套绝对档位。 */
export const space = token('8px', {
  name: 'space',
  state: {
    '&[data-size="small"]': (base) => multiply(base, 1 / 2),
    '&[data-size="large"]': (base) => multiply(base, 3 / 2),
    '&[data-size="xlarge"]': (base) => multiply(base, 2),
  },
})

/** 视口宽度在 360px 至 1440px 区间的进度。 */
export const fluidProgress = token(
  'progress(100vw, 360px, 1440px)',
  'fluid-progress',
)

/** 间隔沿用来源基础和尺寸状态，地址由来源定义明确给出。 */
export const spaceGap = (base: Token<TokenInput> = space) =>
  token(base.default, {
    name: `${base.name ?? 'space'}-gap`,
    address: base.address,
    state: base.state,
  })

/** 纵向内边距使用自身尺寸比例，较大档位不简单放大整个间距。 */
export const spacePaddingBlock = (base: Token<TokenInput> = space) =>
  token(base.default, {
    name: `${base.name ?? 'space'}-padding-block`,
    address: base.address,
    state: {
      ...base.state,
      '&[data-size="large"]': (current) => current,
      '&[data-size="xlarge"]': (current) => multiply(current, 3 / 2),
    },
  })

/** 横向内边距从三倍基础开始，状态在该用途的新基础上计算。 */
export const spacePaddingInline = (base: Token<TokenInput> = space) =>
  token(multiply(base.default, 3), {
    name: `${base.name ?? 'space'}-padding-inline`,
    address: base.address,
    state: {
      ...base.state,
      '&[data-size="large"]': (current) => multiply(current, 4 / 3),
    },
  })
