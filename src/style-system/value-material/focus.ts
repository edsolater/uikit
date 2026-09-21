/** 焦点轮廓的尺寸、配色与状态由材料定义拥有。 */
import { variable } from '../core/css-variable'
import { toneColor } from './color/tone'
import { valueSequence } from '../values/list'
import { focusStrokeWidth, focusGapSize } from './space'

export const focusOutline = variable('none', {
  name: 'focus-outline',
  states: { focus: valueSequence(focusStrokeWidth, 'solid', toneColor('line')) },
})
export const focusOffset = variable('0px', {
  name: 'focus-offset',
  states: { focus: focusGapSize },
})
