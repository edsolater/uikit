/** 圆角基准及相对尺寸状态；具体组件的固定外形由组件定义。 */
import { token } from '../../../token'
import { multiply } from '../functions/calc'

export const radius = token('4px', {
  name: 'radius',
  state: {
    '&[data-size="small"]': base => multiply(base, 1 / 2),
    '&[data-size="large"]': base => multiply(base, 2),
    '&[data-size="xlarge"]': base => multiply(base, 3),
  },
})
