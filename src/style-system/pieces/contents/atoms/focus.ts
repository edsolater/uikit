/** 焦点轮廓的样式变量。
 *
 * 定义焦点尺寸、间距，以及当前作用域的语气边缘配色。
 *
 * 状态展开后仍保留颜色变量引用，使局部配色继续生效。
 */
import { variable } from '../../../variable'
import { toneColors } from './color/colors'
import { valueSequence } from '../atom-creators/list'
import { focusStrokeWidth, focusGapSize } from './space'

export const focusOutline = variable('none', {
  name: 'focus-outline',
  // 轮廓读取当前作用域的语气成员，使 danger 等局部声明继续生效。
  states: {
    focus: valueSequence(focusStrokeWidth, 'solid', toneColors('line')),
  },
})
export const focusOffset = variable('0px', {
  name: 'focus-offset',
  states: { focus: focusGapSize },
})
