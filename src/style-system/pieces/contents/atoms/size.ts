/** 控件尺寸基准及相对状态；组件通过 variableFrom 指定自己的 address。 */
import { variable } from '../../../variable'
import { multiply } from '../functions/calc'

export const controlSize = variable('48px', {
  name: 'control-size',
  states: {
    '&[data-size="small"]': base => multiply(base, 2 / 3),
    '&[data-size="large"]': base => multiply(base, 4 / 3),
    '&[data-size="xlarge"]': base => multiply(base, 5 / 3),
  },
})
