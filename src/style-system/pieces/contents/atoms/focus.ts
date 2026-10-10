/** 焦点轮廓的样式变量。
 *
 * 定义焦点尺寸、间距，以及当前作用域的语气边缘配色。
 *
 * 状态展开后仍保留颜色变量引用，使局部配色继续生效。
 */
import { variable } from '../../../variable'
import { toneColors } from './color/colors'
import { highlightColors } from './color/ui-action-colors'
import { value } from '../../../value'
import { valueSequence } from '../atom-creators/list'
import { focusStrokeWidth, focusGapSize } from './space'

const toneLine = toneColors('line')
const highlightLine = highlightColors('line')
const currentToneLineColor = value([toneLine, highlightLine], {
  toCSSString: (_, resolve) => {
    const fallback = resolve(highlightLine)
    return `var(${toneLine.toCSSString()}, var(${highlightLine.toCSSString()}, ${fallback}))`
  },
})

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
