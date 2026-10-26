/** 控件尺寸基准及相对状态；组件读取定义后创建自己的地址与状态。 */
import { token } from '../../../token'
import { multiply } from '../functions/calc'

export const controlSize = token('48px', {
  name: 'control-size',
  state: {
    '&[data-size="small"]': (base) => multiply(base, 2 / 3),
    '&[data-size="large"]': (base) => multiply(base, 4 / 3),
    '&[data-size="xlarge"]': (base) => multiply(base, 5 / 3),
  },
})
