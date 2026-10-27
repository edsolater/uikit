/** 控件尺寸基准及相对状态；组件读取定义后创建自己的地址与状态。 */
import { token } from '../../token'
import { multiply } from '../functions/calc'
import { whenSmall, whenLarge, whenXlarge } from '../conditions/profile'

export const controlSize = token('48px', {
  name: 'control-size',
  state: {
    [whenSmall.header]: (base) => multiply(base, 2 / 3),
    [whenLarge.header]: (base) => multiply(base, 4 / 3),
    [whenXlarge.header]: (base) => multiply(base, 5 / 3),
  },
})
