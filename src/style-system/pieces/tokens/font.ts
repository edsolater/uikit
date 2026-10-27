/** 字号与字重基准；尺寸状态和消费处的相对取值直接从基准派生。 */
import { token } from '../../token'
import { multiply } from '../functions/calc'
import { whenSmall, whenLarge, whenXlarge } from '../conditions/profile'

export const textSize = token('16px', {
  name: 'text-size',
  state: [
    [whenSmall, (base) => multiply(base, 7 / 8)],
    [whenLarge, (base) => multiply(base, 5 / 4)],
    [whenXlarge, (base) => multiply(base, 3 / 2)],
  ],
})

export const fontWeight = token(400, 'font-weight')
