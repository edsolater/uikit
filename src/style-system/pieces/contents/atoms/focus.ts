/** 焦点轮廓的尺寸、配色与状态由焦点 Atom 自身定义。 */
import { variable } from '../../../variable'
import { toneColor } from './color/tone'
import { valueSequence } from '../atom-creators/list'
import { focusStrokeWidth, focusGapSize } from './space'

export const focusOutline = variable('none', {
  name: 'focus-outline',
  states: { focus: valueSequence(focusStrokeWidth, 'solid', toneColor('line')) },
})
export const focusOffset = variable('0px', {
  name: 'focus-offset',
  states: { focus: focusGapSize },
})
