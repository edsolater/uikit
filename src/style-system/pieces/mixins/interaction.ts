/** 点击交互 Mixin。 */
import { token, type TokenAddress } from '../../token'
import type { Declarations } from '../../rule'
import type { TokenInput } from '../../token'
import {
  $cursor,
  $userSelect,
  $opacity,
  $transform,
  $transition,
  $backgroundColor,
  $color,
  $borderColor,
  $boxShadow,
  $outline,
  $outlineOffset,
} from '@/style-system/key-registry'
import { translateY } from '../functions/transform'
import { opacity } from '../tokens/opacity'
import { multiply } from '../functions/calc'
import { motionDuration, motionEasing } from '../tokens/motion'
import { transitionValue } from '../token-factory/transition'
import { focusOutline, focusOffset } from '../tokens/focus'

/** 可点击效果配置；省略透明度时保留通用禁用淡化策略。 */
export interface ClickableMixinOptions {
  /** 明确交互变量的根据地，不从消费位置隐式推断。 */
  address?: TokenAddress
  opacity?: TokenInput
  focusColor?: TokenInput
}

const quickDuration = multiply(motionDuration, 2 / 3)

/**
 * 生成可点击效果声明。
 * 可用 opacity 选择本主体的透明度，省略时使用通用禁用淡化。
 */
export const clickable = (
  options: ClickableMixinOptions = {},
): Declarations => [
  [$outline, focusOutline(options.focusColor, options.address)],
  [
    $outlineOffset,
    token(focusOffset.default, {
      name: focusOffset.name,
      state: focusOffset.state,
      address: options.address,
    }),
  ],
  [
    $cursor,
    token('pointer', {
      name: 'clickable-cursor',
      address: options.address,
      state: { disabled: 'not-allowed' },
    }),
  ],
  [
    $opacity,
    options.opacity ??
      token(opacity.default, {
        name: 'clickable-opacity',
        state: opacity.state,
        address: options.address,
      }),
  ],
  [
    $transform,
    token('none', {
      name: 'clickable-transform',
      address: options.address,
      state: {
        active: translateY('1px'),
        disabled: 'none',
      },
    }),
  ],
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
