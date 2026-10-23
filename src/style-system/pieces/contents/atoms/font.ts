/** 字号与字重基准；尺寸状态和消费处的相对取值直接从基准派生。 */
import { variable } from '../../../variable'
import { multiply } from '../functions/calc'

export const textSize = variable('16px', {
  name: 'text-size',
  states: {
    '&[data-size="small"]': base => multiply(base, 7 / 8),
    '&[data-size="large"]': base => multiply(base, 5 / 4),
    '&[data-size="xlarge"]': base => multiply(base, 3 / 2),
  },
})

export const fontWeight = variable(400, 'font-weight')
