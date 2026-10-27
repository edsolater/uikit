/** 不透明度基准及相对的强调、禁用状态。 */
import { token } from '../../token'
import { multiply } from '../functions/calc'
import { whenDisabled } from '../conditions/interaction'
import { whenSoft } from '../conditions/profile'

export const baseOpacity = token(1, {
  name: 'base-opacity',
  state: [
    [whenDisabled, (base) => multiply(base, 0.48)],
    [whenSoft, (base) => multiply(base, 0.72)],
  ],
})
