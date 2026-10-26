/** 不透明度基准及相对的强调、禁用状态。 */
import { token } from '../../../token'
import { multiply } from '../functions/calc'

export const opacity = token(1, {
  name: 'opacity',
  state: {
    disabled: (base) => multiply(base, 0.48),
    '&[data-emphasis="soft"]:not(:disabled, [data-status~="disabled"])': (
      base,
    ) => multiply(base, 0.72),
  },
})
