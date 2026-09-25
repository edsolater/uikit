/** 按钮的样式效果与生效条件。 */
import {
  rules,
  variable,
  variableFrom,
  innerText,
  contentLayout,
  size,
  boundary,
  color,
  elevation,
  clickable,
} from '../../../style-system'
import { surfaceColor, foregroundColor } from '../../../style-system/materials/roles/color'
import { $cursor } from '../../../style-system/materials/keys/interaction'
import { $alignSelf } from '../../../style-system/materials/keys/layout'
import { colorMix } from '../../../style-system/materials/valuable-tools/functions/color-mix'
import { textColor } from '../../../style-system/materials/valuables/color/text'
import { actionColor } from '../../../style-system/materials/valuables/color/action'
import { accentColor, dangerColor, toneColor } from '../../../style-system/materials/valuables/color/tone'
import { neutralColor } from '../../../style-system/materials/valuables/color/neutral'
import { pill } from '../../../style-system/materials/valuables/radius'
import { spaceSmall, spaceNormal, spaceMedium, spaceLarge, spaceExtraLarge, spaceWide, spaceWidest, boundaryWidthThin } from '../../../style-system/materials/valuables/space'
import { controlSizeSmall, controlSizeNormal, controlSizeLarge, controlSizeExtraLarge } from '../../../style-system/materials/valuables/size'
import { bold, singleLine, textSizeNormal, textSizeLarge, textSizeExtraLarge, textSizeExtraExtraLarge } from '../../../style-system/materials/valuables/font'
import { shadowFlat, shadowRaised, shadowElevated, shadowInteractive } from '../../../style-system/materials/valuables/shadow'

const button = ['@layer uikit', '.Button']

// =============================================================================
// 默认效果
// =============================================================================

const surfaceColorDefault = variableFrom(surfaceColor, {
  name: 'button-surface-color-default',
  states: {
    hover: colorMix([neutralColor(2), 0.72], accentColor('soft')),
    active: colorMix([neutralColor(3), 0.62], accentColor('soft')),
    disabled: source => colorMix([source, 0.48], neutralColor(2)),
  },
})

const foregroundColorDefault = variableFrom(foregroundColor, {
  name: 'button-foreground-color-default',
  states: {
    hover: textColor('strong'),
    active: textColor('strong'),
    disabled: source => colorMix([source, 0.48], 'transparent'),
  },
})

const opacity = variable(1, {
  name: 'button-opacity',
  states: { disabled: 0.56 },
})

rules(button, [
  [surfaceColor, colorMix([neutralColor(1), 0.82], accentColor('soft'))],
  [foregroundColor, textColor],
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
  color({
    background: surfaceColorDefault,
    foreground: foregroundColorDefault,
  }),
  elevation(shadowInteractive),

  // --- 通用交互 ---
  clickable({ opacity }),
])

// =============================================================================
// variant 动作声量
// =============================================================================

const surfaceColorBare = variableFrom(surfaceColor, {
  name: 'button-surface-color-bare',
  states: {
    hover: colorMix([neutralColor(1), 0.88], accentColor('soft')),
    active: colorMix([neutralColor(2), 0.82], accentColor('soft')),
    disabled: source => colorMix([source, 0.48], neutralColor(2)),
  },
})

rules(
  [...button, '&[data-variant="bare"]'],
  [
    [surfaceColor, 'transparent'],
    color({
      background: surfaceColorBare,
    }),
    elevation(shadowFlat),
  ],
)

const surfaceColorSolid = variableFrom(surfaceColor, {
  name: 'button-surface-color-solid',
  states: {
    hover: actionColor,
    active: actionColor,
    disabled: source => colorMix([source, 0.48], neutralColor(2)),
  },
})

const foregroundColorSolid = variableFrom(foregroundColor, {
  name: 'button-foreground-color-solid',
  states: {
    hover: actionColor('foreground'),
    active: actionColor('foreground'),
    disabled: source => colorMix([source, 0.48], 'transparent'),
  },
})

const shadowSolid = variable(shadowRaised, {
  name: 'button-shadow-solid',
  states: { hover: shadowElevated, active: shadowFlat, disabled: shadowFlat },
})

rules(
  [...button, '&[data-variant="solid"]'],
  [
    [toneColor, actionColor],
    [surfaceColor, actionColor],
    [foregroundColor, colorMix([actionColor('foreground'), 0.9], surfaceColor)],
    color({
      background: surfaceColorSolid,
      foreground: foregroundColorSolid,
    }),
    elevation(shadowSolid),
  ],
)

// =============================================================================
// tone 动作语气
// =============================================================================

const surfaceColorTone = variableFrom(surfaceColor, {
  name: 'button-surface-color-tone',
  states: {
    hover: colorMix([neutralColor(2), 0.68], toneColor('soft')),
    active: colorMix([neutralColor(3), 0.58], toneColor('soft')),
    disabled: source => colorMix([source, 0.48], neutralColor(2)),
  },
})

const foregroundColorTone = variableFrom(foregroundColor, {
  name: 'button-foreground-color-tone',
  states: {
    hover: toneColor('strong'),
    active: toneColor('strong'),
    disabled: source => colorMix([source, 0.48], 'transparent'),
  },
})

rules(
  [...button, '&[data-tone]'],
  [
    [surfaceColor, colorMix([neutralColor(1), 0.76], toneColor('soft'))],
    [foregroundColor, toneColor('strong')],
    color({
      background: surfaceColorTone,
      foreground: foregroundColorTone,
    }),
  ],
)

rules(
  [...button, '&[data-tone="accent"]'],
  [
    [toneColor, accentColor],
  ],
)

rules(
  [...button, '&[data-tone="danger"]'],
  [
    [toneColor, dangerColor],
  ],
)

// --- 语气与声量组合：退场保留透明常态，实心保留语气实底 ---

// TODO: bare 与 tone 的显式交集配方不可组合；下一步改为由独立效果在运行结果中组合，并删除这个交集 Variable。
const surfaceColorBareTone = variableFrom(surfaceColor, {
  name: 'button-surface-color-bare-tone',
  states: {
    hover: colorMix([neutralColor(1), 0.82], toneColor('soft')),
    active: colorMix([neutralColor(2), 0.74], toneColor('soft')),
    disabled: source => colorMix([source, 0.48], neutralColor(2)),
  },
})

rules([...button, '&[data-variant="bare"][data-tone]'], [
  [surfaceColor, 'transparent'],
  color({ background: surfaceColorBareTone }),
])

// TODO: solid 与 tone 的显式交集配方不可组合；下一步改为由独立效果在运行结果中组合，并删除这个交集 Variable。
const surfaceColorSolidTone = variableFrom(surfaceColor, {
  name: 'button-surface-color-solid-tone',
  states: {
    hover: colorMix([toneColor, 0.88], textColor('strong')),
    active: colorMix([toneColor, 0.78], textColor('strong')),
    disabled: source => colorMix([source, 0.48], neutralColor(2)),
  },
})

// TODO: solid 与 tone 的显式交集配方不可组合；下一步改为由独立效果在运行结果中组合，并删除这个交集 Variable。
const foregroundColorSolidTone = variableFrom(foregroundColor, {
  name: 'button-foreground-color-solid-tone',
  states: {
    hover: toneColor('foreground'),
    active: toneColor('foreground'),
    disabled: source => colorMix([source, 0.48], 'transparent'),
  },
})

rules([...button, '&[data-variant="solid"][data-tone]'], [
  [surfaceColor, toneColor],
  [foregroundColor, colorMix([toneColor('foreground'), 0.9], surfaceColor)],
  color({
    background: surfaceColorSolidTone,
    foreground: foregroundColorSolidTone,
  }),
])

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
