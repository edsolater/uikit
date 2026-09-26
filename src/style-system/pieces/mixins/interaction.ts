/** 点击交互 Mixin。 */
import { variable } from '../../variable'
import type { Declarations } from '../../rule'
import { value, type ValueInput } from '../../value'
import { $cursor, $userSelect } from '../keys/interaction'
import { $opacity } from '../keys/opacity'
import { $transform } from '../keys/transform'
import { $transition } from '../keys/transition'
import { $backgroundColor, $color } from '../keys/color'
import { $borderColor } from '../keys/border'
import { $boxShadow } from '../keys/box-shadow'
import { translateY } from '../contents/combiners/transform'
import { disabledFade } from '../contents/atoms/opacity'
import { durationFast, easingStandard } from '../contents/atoms/motion'
import { transitionValue } from '../contents/atom-creators/transition'
import { $outline, $outlineOffset } from '../keys/outline'
import { focusOutline, focusOffset } from '../contents/atoms/focus'

/** 可点击效果配置；省略透明度时保留通用禁用淡化策略。 */
export interface ClickableMixinOptions {
  opacity?: ValueInput
}

/** Mixin：可点击效果；可用 opacity 选择本主体的透明度，省略时使用通用禁用淡化。 */
export const clickable = (options: ClickableMixinOptions = {}): Declarations => [
  [$outline, focusOutline],
  [$outlineOffset, focusOffset],
  [$cursor, variable('pointer', { name: 'clickable-cursor', states: { disabled: 'not-allowed' } })],
  [$opacity, options.opacity ?? variable(1, { name: 'clickable-opacity', states: { disabled: disabledFade } })],
  [$transform, variable('none', {
    name: 'clickable-transform', states: {
      active: translateY('1px'),
      disabled: 'none',
    }
  })],
  [$userSelect, 'none'],
  [
    $transition,
    transitionValue(
      [$backgroundColor, durationFast, easingStandard],
      [$borderColor, durationFast, easingStandard],
      [$boxShadow, durationFast, easingStandard],
      [$color, durationFast, easingStandard],
      [$opacity, durationFast, easingStandard],
      [$transform, durationFast, easingStandard],
    ),
  ],
]
