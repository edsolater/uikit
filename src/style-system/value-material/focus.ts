/** 焦点轮廓的尺寸、配色与状态由材料定义拥有。 */
import { variable } from '../core/css-variable'
import { focusColor } from '../component-handle-material/focus'
import { valueSequence } from '../values/list'
import { focusStrokeWidth, focusGapSize } from './space'

export const focusOutline = variable('none', {
  name: 'focus-outline',
  states: { focusVisible: valueSequence(focusStrokeWidth, 'solid', focusColor) },
})
export const focusOffset = variable('0px', {
  name: 'focus-offset',
  states: { focusVisible: focusGapSize },
})
