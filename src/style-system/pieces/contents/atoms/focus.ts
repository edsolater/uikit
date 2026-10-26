/** 焦点轮廓的样式变量。
 *
 * 定义焦点尺寸、间距，以及当前作用域的语气边缘配色。
 *
 * 状态展开后仍保留颜色变量引用，使局部配色继续生效。
 */
import { token, type TokenAddress } from '../../../token'
import type { TokenInput } from '../../../token'
import { valueSequence } from '../atom-creators/list'
import { space } from './space'
import { boundaryWidth } from './boundary'
import { multiply } from '../functions/calc'
import { allocateVariableName } from '../../../custom-property-names'

export const focusOutline = (
  color: TokenInput = 'currentColor',
  address?: TokenAddress,
) =>
  token('none', {
    name: allocateVariableName(),
    address,
    // 轮廓读取调用者选择的轮廓颜色，使 danger 等局部声明继续生效。
    state: {
      focus: valueSequence(multiply(boundaryWidth, 2), 'solid', color),
    },
  })
export const focusOffset = token('0px', {
  name: 'focus-offset',
  state: { focus: multiply(space, 1 / 4) },
})
