/** 按钮的样式效果与生效条件。 */
import {
  rules,
  value,
  variable,
  innerText,
  contentLayout,
  size,
  boundary,
  color,
  elevation,
  clickable,
} from '../../../style-system'
import { $cursor } from '../../../style-system/properties/interaction'
import { $alignSelf } from '../../../style-system/properties/layout'
import { colorMix } from '../../../style-system/values/functions/color-mix'
import { foreground, strongForeground } from '../../../style-system/values/materials/color/text'
import { action, actionHover, actionActive, actionForeground, actionLine } from '../../../style-system/values/materials/color/action'
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
} from '../../../style-system/values/materials/color/tone'
import { lowSurface, hoverSurface, activeSurface } from '../../../style-system/values/materials/color/palette'
import { pill } from '../../../style-system/values/materials/radius'
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
} from '../../../style-system/values/materials/space'
import { small, normal, large, extraLarge } from '../../../style-system/values/materials/size'
import {
  bold,
  singleLine,
  normalText,
  largeText,
  extraLargeText,
  heading,
} from '../../../style-system/values/materials/font'
import { flat, raised, elevated, interactiveElevation } from '../../../style-system/values/materials/shadow'

const button = ['@layer uikit', '.Button']

/** 常态底色同时供常态显示、实心文字调和和禁用混色读取，不随交互派生。 */
const restSurface = variable('button-rest-surface')

/** 常态文字同时供常态显示与禁用淡化读取。 */
const restForeground = variable('button-rest-foreground')

// =============================================================================
// 默认效果
// =============================================================================

rules(button, [
  [restSurface, colorMix([lowSurface, 0.82], softAccent)],
  [restForeground, foreground],
  // --- 内容排版 ---
  innerText({ font: 'inherit', fontSize: largeText, emphasis: bold, leading: singleLine }),

  // --- 内容布局 ---
  contentLayout({
    mode: 'flex-center',
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
    background: value(restSurface, {
      hover: colorMix([hoverSurface, 0.72], softAccent),
      active: colorMix([activeSurface, 0.62], softAccent),
      disabled: colorMix([restSurface, 0.48], hoverSurface),
    }),
    foreground: value(restForeground, {
      hover: strongForeground,
      active: strongForeground,
      disabled: colorMix([restForeground, 0.48], 'transparent'),
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
    [restSurface, 'transparent'],
    color({
      background: value(restSurface, {
        hover: colorMix([lowSurface, 0.88], softAccent),
        active: colorMix([hoverSurface, 0.82], softAccent),
        disabled: colorMix([restSurface, 0.48], hoverSurface),
      }),
    }),
    elevation(flat),
  ],
)

rules(
  [...button, '&[data-variant="solid"]'],
  [
    [restSurface, action],
    [restForeground, colorMix([actionForeground, 0.9], restSurface)],
    color({
      background: value(restSurface, {
        hover: actionHover,
        active: actionActive,
        disabled: colorMix([restSurface, 0.48], hoverSurface),
      }),
      foreground: value(restForeground, {
        hover: actionForeground,
        active: actionForeground,
        disabled: colorMix([restForeground, 0.48], 'transparent'),
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
    [restSurface, colorMix([lowSurface, 0.76], softTone)],
    [restForeground, strongTone],
    color({
      background: value(restSurface, {
        hover: colorMix([hoverSurface, 0.68], softTone),
        active: colorMix([activeSurface, 0.58], softTone),
        disabled: colorMix([restSurface, 0.48], hoverSurface),
      }),
      foreground: value(restForeground, {
        hover: strongTone,
        active: strongTone,
        disabled: colorMix([restForeground, 0.48], 'transparent'),
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
  [restSurface, 'transparent'],
  color({ background: value(restSurface, {
    hover: colorMix([lowSurface, 0.82], softTone),
    active: colorMix([hoverSurface, 0.74], softTone),
    disabled: colorMix([restSurface, 0.48], hoverSurface),
  }) }),
])

rules([...button, '&[data-variant="solid"][data-tone]'], [
  [restSurface, tone],
  [restForeground, colorMix([toneForeground, 0.9], restSurface)],
  color({
    background: value(restSurface, {
      hover: colorMix([tone, 0.88], strongForeground),
      active: colorMix([tone, 0.78], strongForeground),
      disabled: colorMix([restSurface, 0.48], hoverSurface),
    }),
    foreground: value(restForeground, {
      hover: toneForeground,
      active: toneForeground,
      disabled: colorMix([restForeground, 0.48], 'transparent'),
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

rules([...button, '&[data-status~="loading"]'], [[$cursor, value('progress', { disabled: 'not-allowed' })]])
