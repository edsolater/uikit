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
import { colorMix } from '../../../style-system/values/functions/color-mix'
import { foreground, interactiveForeground } from '../../../style-system/values/materials/color/text'
import { actionForeground, actionSurface } from '../../../style-system/values/materials/color/action'
import {
  accent,
  softAccent,
  accentForeground,
  accentFocus,
  danger,
  softDanger,
  dangerForeground,
  dangerLine,
  tone,
  softTone,
  toneForeground,
  toneSurface,
} from '../../../style-system/values/materials/color/tone'
import { interactiveSurface, hoverOverlay, activeOverlay } from '../../../style-system/values/materials/color/surface'
import { softLine } from '../../../style-system/values/materials/color/edge'
import { surface } from '../../../style-system/values/materials/color/palette'
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
import { flat, raised, interactiveElevation } from '../../../style-system/values/materials/shadow'

const button = '.Button'

/** 默认底色中的中性表面占比。 */
const surfaceRatio = variable('button-surface-ratio', {
  fallback: value(0.82, { hover: 0.72, active: 0.62 }),
})

// =============================================================================
// 默认效果
// =============================================================================

rules(button, [
  // --- 内容排版 ---
  innerText({ font: 'inherit', fontSize: largeText, emphasis: bold, leading: singleLine }),

  // --- 内容布局 ---
  contentLayout({
    mode: 'center',
    gap: normalSpace,
    padding: [normalSpace, extraLargeSpace],
  }),

  // --- 默认物理尺寸 ---
  size({ minHeight: normal }),

  // --- 默认外观 ---
  boundary({
    border: [thinBoundary, 'solid', softLine],
    radius: pill,
  }),
  color({
    background: value(colorMix([interactiveSurface, surfaceRatio], softAccent), { disabled: surface }),
    foreground: interactiveForeground,
  }),
  elevation(interactiveElevation),

  // --- 通用交互 ---
  clickable(),
])

// =============================================================================
// 浏览器交互
// =============================================================================

rules([button, 'focusVisible'], [boundary({
  outline: {
    width: focusStroke,
    style: 'solid',
    color: accentFocus,
    offset: focusGap,
  },
})])
rules([button, '&[data-tone="danger"]', 'focusVisible'], [boundary({ outline: { color: dangerLine } })])

// =============================================================================
// variant 动作声量
// =============================================================================

rules(
  [button, '&[data-variant="bare"]'],
  [
    boundary({ borderColor: 'transparent' }),
    color({
      background: value('transparent', {
        hover: hoverOverlay,
        active: activeOverlay,
        disabled: surface,
      }),
    }),
    elevation(flat),
  ],
)

rules(
  [button, '&[data-variant="solid"]'],
  [
    boundary({ borderColor: 'transparent' }),
    color({
      background: value(actionSurface, { disabled: surface }),
      foreground: value(actionForeground, { disabled: foreground }),
    }),
    elevation(value(raised, { disabled: flat })),
  ],
)

// =============================================================================
// tone 动作语气
// =============================================================================

rules(
  [button, '&[data-tone]'],
  [
    color({
      background: value(toneSurface, { disabled: surface }),
      foreground: value(tone, {
        hover: toneForeground,
        active: toneForeground,
        disabled: foreground,
      }),
    }),
  ],
)

rules(
  [button, '&[data-tone="accent"]'],
  [
    [tone, accent],
    [softTone, softAccent],
    [toneForeground, accentForeground],
    boundary({ borderColor: softAccent }),
  ],
)

rules(
  [button, '&[data-tone="danger"]'],
  [
    [tone, danger],
    [softTone, softDanger],
    [toneForeground, dangerForeground],
    boundary({ borderColor: softDanger }),
  ],
)

/** 实心语气按钮的禁用文字仍保持动作前景色。 */
rules([button, '&[data-variant="solid"][data-tone]', 'disabled'], [color({ foreground: actionForeground })])

// =============================================================================
// size 物理尺寸
// =============================================================================

rules(
  [button, '&[data-size="small"]'],
  [
    innerText({ fontSize: normalText }),
    contentLayout({ gap: smallSpace, padding: [smallSpace, mediumSpace] }),
    size({ minHeight: small }),
  ],
)

rules(
  [button, '&[data-size="large"]'],
  [
    innerText({ fontSize: extraLargeText }),
    contentLayout({ gap: mediumSpace, padding: [normalSpace, wideSpace] }),
    size({ minHeight: large }),
  ],
)

rules(
  [button, '&[data-size="xlarge"]'],
  [
    innerText({ fontSize: heading }),
    contentLayout({ gap: largeSpace, padding: [mediumSpace, widestSpace] }),
    size({ minHeight: extraLarge }),
  ],
)

// =============================================================================
// status 外部状态
// =============================================================================

rules([button, '&[data-status~="loading"]'], [[$cursor, value('progress', { disabled: 'not-allowed' })]])
