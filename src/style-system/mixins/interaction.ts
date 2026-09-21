/** 点击交互 Mixin。 */
import { variable } from '../core/css-variable'
import type { Declarations } from '../core/css-rule'
import { value, type ValueInput } from '../core/css-value'
import { $cursor, $userSelect } from '../properties/interaction'
import { $opacity } from '../properties/opacity'
import { $transform } from '../properties/transform'
import { $transition } from '../properties/transition'
import { $backgroundColor, $color } from '../properties/color'
import { $borderColor } from '../properties/border'
import { $boxShadow } from '../properties/box-shadow'
import { translateY } from '../values/functions/transform'
import { disabledFade } from '../value-material/opacity'
import { durationFast, easingStandard } from '../value-material/motion'
import { transitionValue } from '../values/transition'
import { $outline, $outlineOffset } from '../properties/outline'
import { focusOutline, focusOffset } from '../value-material/focus'

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
