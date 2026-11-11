/**
 * Board的网格承载材质。
 *
 * 按声量与容纳尺度定义背景、边界和内部空间。
 *
 * 语义身份不复制视觉实现，上层主体可消费公开边界材料形成自身反馈。
 */
import {
  rules,
  token,
  stateCondition,
  color,
  colorMix,
  surfaceColorTheme,
  boundaryColorTheme,
  baseBorderWidth,
  baseSpace,
  baseRadius,
  baseShadow,
  baseShadowSmall,
  multiply,
} from '@/style-system'
import { valueSequence } from '@/style-system/pieces/token-factory/list'
const soft = stateCondition('&[data-variant="soft"]')
const solid = stateCondition('&[data-variant="solid"]')
const boardLineColor = color({
  base: boundaryColorTheme,
  alpha: (alpha) => multiply(alpha, 0.5),
})
const background = token(colorMix([surfaceColorTheme, 0.78], 'transparent'), {
  name: 'board-background',
  state: [
    [soft, colorMix([surfaceColorTheme, 0.58], 'transparent')],
    [solid, surfaceColorTheme],
  ],
})
/** 完整边界材料，允许信息主体派生自己的语义差异。 */
export const boardBorder = token(
  valueSequence(
    baseBorderWidth,
    'solid',
    colorMix([boardLineColor, 0.72], 'transparent'),
  ),
  {
    name: 'board-border',
    state: [
      [
        soft,
        valueSequence(
          baseBorderWidth,
          'solid',
          colorMix([boardLineColor, 0.48], 'transparent'),
        ),
      ],
      [solid, valueSequence(baseBorderWidth, 'solid', boardLineColor)],
    ],
  },
)
const shadow = token(() => baseShadow, {
  name: 'board-shadow',
  state: [[soft, baseShadowSmall]],
})
const padding = token(multiply(baseSpace, 3), {
  name: 'board-padding',
  state: {
    small: multiply(baseSpace, 1.5),
    large: multiply(baseSpace, 4),
    xlarge: multiply(baseSpace, 6),
  },
})
const gap = token(multiply(baseSpace, 2), {
  name: 'board-gap',
  state: {
    small: baseSpace,
    large: multiply(baseSpace, 3),
    xlarge: multiply(baseSpace, 4),
  },
})
const radius = token(multiply(baseRadius, 3), {
  name: 'board-radius',
  state: { small: multiply(baseRadius, 2) },
})
rules('.Board', {
  'display': 'grid',
  'margin-trim': 'none',
  gap,
  padding,
  'border': boardBorder,
  'border-radius': radius,
  background,
  'box-shadow': shadow,
  'backdrop-filter': 'saturate(1.12) brightness(1.03)',
})
