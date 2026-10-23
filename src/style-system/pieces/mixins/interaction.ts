/** 点击交互 Mixin。 */
import { variable, variableFrom, type VariableAddress } from '../../variable'
import type { Declarations } from '../../rule'
import type { ValueInput } from '../../value'
import { $cursor, $userSelect } from '../keys/interaction'
import { $opacity } from '../keys/opacity'
import { $transform } from '../keys/transform'
import { $transition } from '../keys/transition'
import { $backgroundColor, $color } from '../keys/color'
import { $borderColor } from '../keys/border'
import { $boxShadow } from '../keys/box-shadow'
import { translateY } from '../contents/functions/transform'
import { opacity } from '../contents/atoms/opacity'
import { multiply } from '../contents/functions/calc'
import { motionDuration, motionEasing } from '../contents/atoms/motion'
import { transitionValue } from '../contents/atom-creators/transition'
import { $outline, $outlineOffset } from '../keys/outline'
import { focusOutline, focusOffset } from '../contents/atoms/focus'

/** 可点击效果配置；省略透明度时保留通用禁用淡化策略。 */
export interface ClickableMixinOptions {
  /** 明确交互变量的根据地，不从消费位置隐式推断。 */
  address?: VariableAddress
  opacity?: ValueInput
  focusColor?: ValueInput
}

const quickDuration = multiply(motionDuration, 2 / 3)

/** Mixin：可点击效果；可用 opacity 选择本主体的透明度，省略时使用通用禁用淡化。 */
export const clickable = (options: ClickableMixinOptions = {}): Declarations => [
  [$outline, focusOutline(options.focusColor, options.address)],
  [$outlineOffset, variableFrom(focusOffset, focusOffset.content, { address: options.address })],
  [$cursor, variable('pointer', { name: 'clickable-cursor', address: options.address, states: { disabled: 'not-allowed' } })],
  [$opacity, options.opacity ?? variableFrom(opacity, opacity, { name: 'clickable-opacity', address: options.address })],
  [$transform, variable('none', {
    name: 'clickable-transform', address: options.address, states: {
      active: translateY('1px'),
      disabled: 'none',
    }
  })],
  [$userSelect, 'none'],
  [
    $transition,
    transitionValue(
      [$backgroundColor, quickDuration, motionEasing],
      [$borderColor, quickDuration, motionEasing],
      [$boxShadow, quickDuration, motionEasing],
      [$color, quickDuration, motionEasing],
      [$opacity, quickDuration, motionEasing],
      [$transform, quickDuration, motionEasing],
    ),
  ],
]
