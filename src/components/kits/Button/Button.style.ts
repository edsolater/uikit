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
import { surfaceColor, foregroundColor } from '../../../style-system/component-handle-material/color'
import { $cursor } from '../../../style-system/properties/interaction'
import { focusColor } from '../../../style-system/component-handle-material/focus'
import { $alignSelf } from '../../../style-system/properties/layout'
import { colorMix } from '../../../style-system/values/functions/color-mix'
import { textColor } from '../../../style-system/value-material/color/text'
import { actionColor } from '../../../style-system/value-material/color/action'
import { accentColor, dangerColor, toneColor } from '../../../style-system/value-material/color/tone'
import { neutralColor } from '../../../style-system/value-material/color/palette'
import { pill } from '../../../style-system/value-material/radius'
import { smallSpace, normalSpace, mediumSpace, largeSpace, extraLargeSpace, wideSpace, widestSpace, thinBoundaryWidth } from '../../../style-system/value-material/space'
import { smallSize, normalSize, largeSize, extraLargeSize } from '../../../style-system/value-material/size'
import { bold, singleLine, normalTextSize, largeTextSize, extraLargeTextSize, headingSize } from '../../../style-system/value-material/font'
import { flatShadow, raisedShadow, elevatedShadow, interactiveShadow } from '../../../style-system/value-material/shadow'

const button = ['@layer uikit', '.Button']

// =============================================================================
// 默认效果
// =============================================================================

const buttonDefaultSurfaceColor = variableFrom(surfaceColor, {
  name: 'button-default-surface-color',
  states: {
    hover: colorMix([neutralColor(2), 0.72], accentColor('soft')),
    active: colorMix([neutralColor(3), 0.62], accentColor('soft')),
    disabled: source => colorMix([source, 0.48], neutralColor(2)),
  },
})

const buttonDefaultForegroundColor = variableFrom(foregroundColor, {
  name: 'button-default-foreground-color',
  states: {
    hover: textColor('strong'),
    active: textColor('strong'),
    disabled: source => colorMix([source, 0.48], 'transparent'),
  },
})

const buttonDefaultOpacity = variable(1, {
  name: 'button-default-opacity',
  states: { disabled: 0.56 },
})

rules(button, [
  [surfaceColor, colorMix([neutralColor(1), 0.82], accentColor('soft'))],
  [foregroundColor, textColor],
  // --- 内容排版 ---
  innerText({ font: 'inherit', fontSize: largeTextSize, emphasis: bold, leading: singleLine }),

  // --- 内容布局 ---
  contentLayout({
    mode: 'center',
    gap: normalSpace,
    padding: [normalSpace, extraLargeSpace],
  }),
  [$alignSelf, 'center'],

  // --- 默认物理尺寸 ---
  size({ minHeight: normalSize }),

  // --- 默认外观 ---
  boundary({
    border: [thinBoundaryWidth, 'solid', 'transparent'],
    radius: pill,
    cornerShape: 'squircle',
  }),
  color({
    background: buttonDefaultSurfaceColor,
    foreground: buttonDefaultForegroundColor,
  }),
  elevation(interactiveShadow),

  // --- 通用交互 ---
  clickable({ opacity: buttonDefaultOpacity }),
])

// =============================================================================
// variant 动作声量
// =============================================================================

const buttonBareSurfaceColor = variableFrom(surfaceColor, {
  name: 'button-bare-surface-color',
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
      background: buttonBareSurfaceColor,
    }),
    elevation(flatShadow),
  ],
)

const buttonSolidSurfaceColor = variableFrom(surfaceColor, {
  name: 'button-solid-surface-color',
  states: {
    hover: actionColor,
    active: actionColor,
    disabled: source => colorMix([source, 0.48], neutralColor(2)),
  },
})

const buttonSolidForegroundColor = variableFrom(foregroundColor, {
  name: 'button-solid-foreground-color',
  states: {
    hover: actionColor('foreground'),
    active: actionColor('foreground'),
    disabled: source => colorMix([source, 0.48], 'transparent'),
  },
})

const buttonSolidShadow = variable(raisedShadow, {
  name: 'button-solid-shadow',
  states: { hover: elevatedShadow, active: flatShadow, disabled: flatShadow },
})

rules(
  [...button, '&[data-variant="solid"]'],
  [
    [focusColor, actionColor('line')],
    [surfaceColor, actionColor],
    [foregroundColor, colorMix([actionColor('foreground'), 0.9], surfaceColor)],
    color({
      background: buttonSolidSurfaceColor,
      foreground: buttonSolidForegroundColor,
    }),
    elevation(buttonSolidShadow),
  ],
)

// =============================================================================
// tone 动作语气
// =============================================================================

const buttonToneSurfaceColor = variableFrom(surfaceColor, {
  name: 'button-tone-surface-color',
  states: {
    hover: colorMix([neutralColor(2), 0.68], toneColor('soft')),
    active: colorMix([neutralColor(3), 0.58], toneColor('soft')),
    disabled: source => colorMix([source, 0.48], neutralColor(2)),
  },
})

const buttonToneForegroundColor = variableFrom(foregroundColor, {
  name: 'button-tone-foreground-color',
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
      background: buttonToneSurfaceColor,
      foreground: buttonToneForegroundColor,
    }),
  ],
)

rules(
  [...button, '&[data-tone="accent"]'],
  [
    [focusColor, accentColor('focus')],
    [toneColor, accentColor],
    [toneColor('soft'), accentColor('soft')],
    [toneColor('strong'), accentColor('strong')],
    [toneColor('foreground'), accentColor('foreground')],
  ],
)

rules(
  [...button, '&[data-tone="danger"]'],
  [
    [focusColor, dangerColor('line')],
    [toneColor, dangerColor],
    [toneColor('soft'), dangerColor('soft')],
    [toneColor('strong'), dangerColor],
    [toneColor('foreground'), dangerColor('foreground')],
  ],
)

// --- 语气与声量组合：退场保留透明常态，实心保留语气实底 ---

const buttonBareToneSurfaceColor = variableFrom(surfaceColor, {
  name: 'button-bare-tone-surface-color',
  states: {
    hover: colorMix([neutralColor(1), 0.82], toneColor('soft')),
    active: colorMix([neutralColor(2), 0.74], toneColor('soft')),
    disabled: source => colorMix([source, 0.48], neutralColor(2)),
  },
})

rules([...button, '&[data-variant="bare"][data-tone]'], [
  [surfaceColor, 'transparent'],
  color({ background: buttonBareToneSurfaceColor }),
])

const buttonSolidToneSurfaceColor = variableFrom(surfaceColor, {
  name: 'button-solid-tone-surface-color',
  states: {
    hover: colorMix([toneColor, 0.88], textColor('strong')),
    active: colorMix([toneColor, 0.78], textColor('strong')),
    disabled: source => colorMix([source, 0.48], neutralColor(2)),
  },
})

const buttonSolidToneForegroundColor = variableFrom(foregroundColor, {
  name: 'button-solid-tone-foreground-color',
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
    background: buttonSolidToneSurfaceColor,
    foreground: buttonSolidToneForegroundColor,
  }),
])

// =============================================================================
// size 物理尺寸
// =============================================================================

rules(
  [...button, '&[data-size="small"]'],
  [
    innerText({ fontSize: normalTextSize }),
    contentLayout({ gap: smallSpace, padding: [smallSpace, mediumSpace] }),
    size({ minHeight: smallSize }),
  ],
)

rules(
  [...button, '&[data-size="large"]'],
  [
    innerText({ fontSize: extraLargeTextSize }),
    contentLayout({ gap: mediumSpace, padding: [normalSpace, wideSpace] }),
    size({ minHeight: largeSize }),
  ],
)

rules(
  [...button, '&[data-size="xlarge"]'],
  [
    innerText({ fontSize: headingSize }),
    contentLayout({ gap: largeSpace, padding: [mediumSpace, widestSpace] }),
    size({ minHeight: extraLargeSize }),
  ],
)

// =============================================================================
// status 外部状态
// =============================================================================

const buttonLoadingCursor = variable('progress', {
  name: 'button-loading-cursor',
  states: { disabled: 'not-allowed' },
})

rules([...button, '&[data-status~="loading"]'], [[$cursor, buttonLoadingCursor]])
