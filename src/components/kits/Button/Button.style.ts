/** 按钮的样式效果与生效条件。 */
import {
  rules,
  value,
  innerText,
  contentLayout,
  size,
  boundary,
  color,
  elevation,
  clickable,
} from '../../../style-system'
import { surfaceColor, foregroundColor } from '../../../style-system/component-handle-material/color'
import { $alignSelf } from '../../../style-system/properties/layout'
import { colorMix } from '../../../style-system/values/functions/color-mix'
import { foreground, strongForeground } from '../../../style-system/value-material/color/text'
import { action, actionHover, actionActive, actionForeground, actionLine } from '../../../style-system/value-material/color/action'
import {
  accent,
  softAccent,
  strongAccent,
  accentForeground,
  accentFocus,
  danger,
  softDanger,
  dangerForeground,
  dangerLine,
  tone,
  softTone,
  strongTone,
  toneForeground,
} from '../../../style-system/value-material/color/tone'
import { paletteColor } from '../../../style-system/value-material/color/palette'
import { pill } from '../../../style-system/value-material/radius'
import {
  smallSpace,
  normalSpace,
  mediumSpace,
  largeSpace,
  extraLargeSpace,
  wideSpace,
  widestSpace,
  thinBoundary,
  focusStroke,
  focusGap,
} from '../../../style-system/value-material/space'
import { small, normal, large, extraLarge } from '../../../style-system/value-material/size'
import {
  bold,
  singleLine,
  normalText,
  largeText,
  extraLargeText,
  heading,
} from '../../../style-system/value-material/font'
import { flat, raised, elevated, interactiveElevation } from '../../../style-system/value-material/shadow'

const button = ['@layer uikit', '.Button']

// =============================================================================
// 默认效果
// =============================================================================

rules(button, [
  [surfaceColor, colorMix([paletteColor('neutral', 1), 0.82], softAccent)],
  [foregroundColor, foreground],
  // --- 内容排版 ---
  innerText({ font: 'inherit', fontSize: largeText, emphasis: bold, leading: singleLine }),

  // --- 内容布局 ---
  contentLayout({
    mode: 'center',
    gap: normalSpace,
    padding: [normalSpace, extraLargeSpace],
  }),
  [$alignSelf, 'center'],

  // --- 默认物理尺寸 ---
  size({ minHeight: normal }),

  // --- 默认外观 ---
  boundary({
    border: [thinBoundary, 'solid', 'transparent'],
    radius: pill,
    cornerShape: 'squircle',
  }),
  color({
    background: value(surfaceColor, {
      hover: colorMix([paletteColor('neutral', 2), 0.72], softAccent),
      active: colorMix([paletteColor('neutral', 3), 0.62], softAccent),
      disabled: colorMix([surfaceColor, 0.48], paletteColor('neutral', 2)),
    }),
    foreground: value(foregroundColor, {
      hover: strongForeground,
      active: strongForeground,
      disabled: colorMix([foregroundColor, 0.48], 'transparent'),
    }),
  }),
  elevation(interactiveElevation),

  // --- 通用交互 ---
  clickable({ opacity: value(1, { disabled: 0.56 }) }),
])

// =============================================================================
// 浏览器交互
// =============================================================================

rules([...button, 'focusVisible'], [boundary({
  outline: {
    width: focusStroke,
    style: 'solid',
    color: accentFocus,
    offset: focusGap,
  },
})])
rules([...button, '&[data-variant="solid"]', 'focusVisible'], [boundary({ outline: { color: actionLine } })])
rules([...button, '&[data-tone="accent"]', 'focusVisible'], [boundary({ outline: { color: accentFocus } })])
rules([...button, '&[data-tone="danger"]', 'focusVisible'], [boundary({ outline: { color: dangerLine } })])

// =============================================================================
// variant 动作声量
// =============================================================================

rules(
  [...button, '&[data-variant="bare"]'],
  [
    [surfaceColor, 'transparent'],
    color({
      background: value(surfaceColor, {
        hover: colorMix([paletteColor('neutral', 1), 0.88], softAccent),
        active: colorMix([paletteColor('neutral', 2), 0.82], softAccent),
        disabled: colorMix([surfaceColor, 0.48], paletteColor('neutral', 2)),
      }),
    }),
    elevation(flat),
  ],
)

rules(
  [...button, '&[data-variant="solid"]'],
  [
    [surfaceColor, action],
    [foregroundColor, colorMix([actionForeground, 0.9], surfaceColor)],
    color({
      background: value(surfaceColor, {
        hover: actionHover,
        active: actionActive,
        disabled: colorMix([surfaceColor, 0.48], paletteColor('neutral', 2)),
      }),
      foreground: value(foregroundColor, {
        hover: actionForeground,
        active: actionForeground,
        disabled: colorMix([foregroundColor, 0.48], 'transparent'),
      }),
    }),
    elevation(value(raised, { hover: elevated, active: flat, disabled: flat })),
  ],
)

// =============================================================================
// tone 动作语气
// =============================================================================

rules(
  [...button, '&[data-tone]'],
  [
    [surfaceColor, colorMix([paletteColor('neutral', 1), 0.76], softTone)],
    [foregroundColor, strongTone],
    color({
      background: value(surfaceColor, {
        hover: colorMix([paletteColor('neutral', 2), 0.68], softTone),
        active: colorMix([paletteColor('neutral', 3), 0.58], softTone),
        disabled: colorMix([surfaceColor, 0.48], paletteColor('neutral', 2)),
      }),
      foreground: value(foregroundColor, {
        hover: strongTone,
        active: strongTone,
        disabled: colorMix([foregroundColor, 0.48], 'transparent'),
      }),
    }),
  ],
)

rules(
  [...button, '&[data-tone="accent"]'],
  [
    [tone, accent],
    [softTone, softAccent],
    [strongTone, strongAccent],
    [toneForeground, accentForeground],
  ],
)

rules(
  [...button, '&[data-tone="danger"]'],
  [
    [tone, danger],
    [softTone, softDanger],
    [strongTone, danger],
    [toneForeground, dangerForeground],
  ],
)

// --- 语气与声量组合：退场保留透明常态，实心保留语气实底 ---

rules([...button, '&[data-variant="bare"][data-tone]'], [
  [surfaceColor, 'transparent'],
  color({ background: value(surfaceColor, {
    hover: colorMix([paletteColor('neutral', 1), 0.82], softTone),
    active: colorMix([paletteColor('neutral', 2), 0.74], softTone),
    disabled: colorMix([surfaceColor, 0.48], paletteColor('neutral', 2)),
  }) }),
])

rules([...button, '&[data-variant="solid"][data-tone]'], [
  [surfaceColor, tone],
  [foregroundColor, colorMix([toneForeground, 0.9], surfaceColor)],
  color({
    background: value(surfaceColor, {
      hover: colorMix([tone, 0.88], strongForeground),
      active: colorMix([tone, 0.78], strongForeground),
      disabled: colorMix([surfaceColor, 0.48], paletteColor('neutral', 2)),
    }),
    foreground: value(foregroundColor, {
      hover: toneForeground,
      active: toneForeground,
      disabled: colorMix([foregroundColor, 0.48], 'transparent'),
    }),
  }),
])

// =============================================================================
// size 物理尺寸
// =============================================================================

rules(
  [...button, '&[data-size="small"]'],
  [
    innerText({ fontSize: normalText }),
    contentLayout({ gap: smallSpace, padding: [smallSpace, mediumSpace] }),
    size({ minHeight: small }),
  ],
)

rules(
  [...button, '&[data-size="large"]'],
  [
    innerText({ fontSize: extraLargeText }),
    contentLayout({ gap: mediumSpace, padding: [normalSpace, wideSpace] }),
    size({ minHeight: large }),
  ],
)

rules(
  [...button, '&[data-size="xlarge"]'],
  [
    innerText({ fontSize: heading }),
    contentLayout({ gap: largeSpace, padding: [mediumSpace, widestSpace] }),
    size({ minHeight: extraLarge }),
  ],
)

// =============================================================================
// status 外部状态
// =============================================================================

rules([...button, '&[data-status~="loading"]'], { cursor: value('progress', { disabled: 'not-allowed' }) })
