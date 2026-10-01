/** 按钮的样式效果与生效条件。 */
import {
  rules,
  variable,
  innerText,
  contentLayout,
  size,
  boundary,
  color,
  elevation,
  clickable,
} from '../../../style-system'
import { surfaceColor, foregroundColor } from '../../../style-system/pieces/roles/color'
import { $cursor } from '../../../style-system/pieces/keys/interaction'
import { $alignSelf } from '../../../style-system/pieces/keys/layout'
import { colorMix } from '../../../style-system/pieces/contents/combiners/color-mix'
import { textColor } from '../../../style-system/pieces/contents/atoms/color/text'
import { actionColor } from '../../../style-system/pieces/contents/atoms/color/action'
import { accentColor, dangerColor, toneColor } from '../../../style-system/pieces/contents/atoms/color/tone'
import { neutralColor } from '../../../style-system/pieces/contents/atoms/color/neutral'
import { pill } from '../../../style-system/pieces/contents/atoms/radius'
import { spaceSmall, spaceNormal, spaceMedium, spaceLarge, spaceExtraLarge, spaceWide, spaceWidest, boundaryWidthThin } from '../../../style-system/pieces/contents/atoms/space'
import { controlSizeSmall, controlSizeNormal, controlSizeLarge, controlSizeExtraLarge } from '../../../style-system/pieces/contents/atoms/size'
import { bold, singleLine, textSizeNormal, textSizeLarge, textSizeExtraLarge, textSizeExtraExtraLarge } from '../../../style-system/pieces/contents/atoms/font'
import { shadowFlat, shadowRaised, shadowElevated, shadowInteractive } from '../../../style-system/pieces/contents/atoms/shadow'

const button = ['@layer uikit', '.Button']

// =============================================================================
// 默认效果
// =============================================================================

// 最终颜色从当前角色值继续派生；禁用效果与声量、语气共用这一份局部基础值。
const buttonSurfaceColor = variable(surfaceColor, {
  name: 'button-surface-color',
  modification: { apply: (current, weight: number) => colorMix([current, weight], neutralColor(2)) },
})
const buttonForegroundColor = variable(foregroundColor, {
  name: 'button-foreground-color',
  modification: { apply: (current, weight: number) => colorMix([current, weight], 'transparent') },
})

const opacity = variable(1, {
  name: 'button-opacity',
  states: { disabled: 0.56 },
})

rules(button, [
  [surfaceColor, colorMix([neutralColor(1), 0.82], accentColor('soft'))],
  [foregroundColor, textColor],
  buttonSurfaceColor.declare(),
  buttonForegroundColor.declare(),
  // --- 内容排版 ---
  innerText({ font: 'inherit', fontSize: textSizeLarge, emphasis: bold, leading: singleLine }),

  // --- 内容布局 ---
  contentLayout({
    mode: 'center',
    gap: spaceNormal,
    padding: [spaceNormal, spaceExtraLarge],
  }),
  [$alignSelf, 'center'],

  // --- 默认物理尺寸 ---
  size({ minHeight: controlSizeNormal }),

  // --- 默认外观 ---
  boundary({
    border: [boundaryWidthThin, 'solid', 'transparent'],
    radius: pill,
    cornerShape: 'squircle',
  }),
  color({ background: buttonSurfaceColor, foreground: buttonForegroundColor }),
  elevation(shadowInteractive),

  // --- 通用交互 ---
  clickable({ opacity }),
])

// 普通状态声明保持来源的 JSS 身份，由当前位置的角色与语气声明决定颜色。
rules([...button, 'hover'], [
  [surfaceColor, colorMix([neutralColor(2), 0.72], accentColor('soft'))],
  [foregroundColor, textColor('strong')],
])
rules([...button, 'active'], [
  [surfaceColor, colorMix([neutralColor(3), 0.62], accentColor('soft'))],
  [foregroundColor, textColor('strong')],
])

// =============================================================================
// variant 动作声量
// =============================================================================

const bareButton = [...button, '&[data-variant="bare"]']
rules(bareButton, [[surfaceColor, 'transparent'], elevation(shadowFlat)])
rules([...bareButton, 'hover'], [[surfaceColor, colorMix([neutralColor(1), 0.88], accentColor('soft'))]])
rules([...bareButton, 'active'], [[surfaceColor, colorMix([neutralColor(2), 0.82], accentColor('soft'))]])

const shadowSolid = variable(shadowRaised, {
  name: 'button-shadow-solid',
  states: { hover: shadowElevated, active: shadowFlat, disabled: shadowFlat },
})

const solidButton = [...button, '&[data-variant="solid"]']
rules(solidButton, [
  [toneColor, actionColor],
  [surfaceColor, actionColor],
  [foregroundColor, colorMix([actionColor('foreground'), 0.9], surfaceColor)],
  elevation(shadowSolid),
])
rules([...solidButton, 'hover'], [[foregroundColor, actionColor('foreground')]])
rules([...solidButton, 'active'], [[foregroundColor, actionColor('foreground')]])

// =============================================================================
// tone 动作语气
// =============================================================================

const toneButton = [...button, '&[data-tone]']
rules(toneButton, [
  [surfaceColor, colorMix([neutralColor(1), 0.76], toneColor('soft'))],
  [foregroundColor, toneColor('strong')],
])
rules([...toneButton, 'hover'], [
  [surfaceColor, colorMix([neutralColor(2), 0.68], toneColor('soft'))],
  [foregroundColor, toneColor('strong')],
])
rules([...toneButton, 'active'], [
  [surfaceColor, colorMix([neutralColor(3), 0.58], toneColor('soft'))],
  [foregroundColor, toneColor('strong')],
])

rules([...button, '&[data-tone="accent"]'], [[toneColor, accentColor]])
rules([...button, '&[data-tone="danger"]'], [[toneColor, dangerColor]])

// --- 语气与声量组合：退场保留透明常态，实心保留语气实底 ---
// TODO: 当前交集仍有专属混色比例，后续应由声量与语气的独立效果组合表达。

const bareToneButton = [...button, '&[data-variant="bare"][data-tone]']
rules(bareToneButton, [[surfaceColor, 'transparent']])
rules([...bareToneButton, 'hover'], [[surfaceColor, colorMix([neutralColor(1), 0.82], toneColor('soft'))]])
rules([...bareToneButton, 'active'], [[surfaceColor, colorMix([neutralColor(2), 0.74], toneColor('soft'))]])

const solidToneButton = [...button, '&[data-variant="solid"][data-tone]']
rules(solidToneButton, [
  [surfaceColor, toneColor],
  [foregroundColor, colorMix([toneColor('foreground'), 0.9], surfaceColor)],
])
rules([...solidToneButton, 'hover'], [
  [surfaceColor, colorMix([toneColor, 0.88], textColor('strong'))],
  [foregroundColor, toneColor('foreground')],
])
rules([...solidToneButton, 'active'], [
  [surfaceColor, colorMix([toneColor, 0.78], textColor('strong'))],
  [foregroundColor, toneColor('foreground')],
])

// 禁用从当前基色派生一次，不为各个声量与语气重复枚举退化配方。
rules([...button, 'disabled'], [buttonSurfaceColor.modify(0.48), buttonForegroundColor.modify(0.48)])

// =============================================================================
// size 物理尺寸
// =============================================================================

rules(
  [...button, '&[data-size="small"]'],
  [
    innerText({ fontSize: textSizeNormal }),
    contentLayout({ gap: spaceSmall, padding: [spaceSmall, spaceMedium] }),
    size({ minHeight: controlSizeSmall }),
  ],
)

rules(
  [...button, '&[data-size="large"]'],
  [
    innerText({ fontSize: textSizeExtraLarge }),
    contentLayout({ gap: spaceMedium, padding: [spaceNormal, spaceWide] }),
    size({ minHeight: controlSizeLarge }),
  ],
)

rules(
  [...button, '&[data-size="xlarge"]'],
  [
    innerText({ fontSize: textSizeExtraExtraLarge }),
    contentLayout({ gap: spaceLarge, padding: [spaceMedium, spaceWidest] }),
    size({ minHeight: controlSizeExtraLarge }),
  ],
)

// =============================================================================
// status 外部状态
// =============================================================================

const cursorLoading = variable('progress', {
  name: 'button-cursor-loading',
  states: { disabled: 'not-allowed' },
})

rules([...button, '&[data-status~="loading"]'], [[$cursor, cursorLoading]])
