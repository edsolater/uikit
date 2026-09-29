/** 焦点轮廓的尺寸、配色与状态由焦点 Atom 自身定义。 */
import { variable } from '../../../variable'
import { accentColor, toneColor } from './color/tone'
import { valueSequence } from '../atom-creators/list'
import { focusStrokeWidth, focusGapSize } from './space'

const currentToneLineColor = `var(${toneColor('line').toCSSString()}, var(${accentColor('line').toCSSString()}, var(--color-accent-focus)))`

export const focusOutline = variable('none', {
  name: 'focus-outline',
  // 轮廓读取当前作用域的语气成员，使 danger 等局部声明继续生效。
  states: {
    focus: valueSequence(focusStrokeWidth, 'solid', currentToneLineColor),
  },
})
export const focusOffset = variable('0px', {
  name: 'focus-offset',
  states: { focus: focusGapSize },
})
