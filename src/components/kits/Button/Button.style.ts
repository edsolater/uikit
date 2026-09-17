/** 按钮的样式配置与注册。 */
import { rules, $focusVisible, inlineCenter } from '../../../style-system'
import { $transition } from '../../../style-system/properties/transition'
import { $transform } from '../../../style-system/properties/transform'
import { $minHeight } from '../../../style-system/properties/size'
import { $padding } from '../../../style-system/properties/padding'
import { $outlineWidth, $outlineStyle, $outlineColor, $outlineOffset } from '../../../style-system/properties/outline'
import { $opacity } from '../../../style-system/properties/opacity'
import { $gap } from '../../../style-system/properties/layout'
import { $cursor, $userSelect } from '../../../style-system/properties/interaction'
import { $font, $fontSize, $fontWeight, $lineHeight } from '../../../style-system/properties/font'
import { $color, $backgroundColor } from '../../../style-system/properties/color'
import { $boxShadow } from '../../../style-system/properties/box-shadow'
import { $borderColor, $border, $borderRadius } from '../../../style-system/properties/border'
import { color } from '../../../style-system/values/materials/color-text'
import { actionForeground, actionSurface } from '../../../style-system/values/materials/color-action'
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
} from '../../../style-system/values/materials/color-tone'
import { backgroundColor, bareActionSurface } from '../../../style-system/values/materials/color-surface'
import { pill } from '../../../style-system/values/materials/radius'
import {
  smallSpace,
  normalSpace,
  mediumSpace,
  largeSpace,
  wideSpace,
  widestSpace,
  thinBoundary,
  focusStroke,
  focusGap,
  paddingInline,
  paddingBlock,
  gap,
} from '../../../style-system/values/materials/space'
import { small, large, extraLarge, minHeight } from '../../../style-system/values/materials/size'
import {
  bold,
  normalText,
  extraLargeText,
  heading,
  fontSize,
  fontWeight,
  lineHeight,
} from '../../../style-system/values/materials/font'
import { fast, standard } from '../../../style-system/values/materials/motion'
import { flat, raised, boxShadow } from '../../../style-system/values/materials/shadow'
import { cursor, opacity, pressFeedback } from '../../../style-system/values/materials/interaction'
import { borderColor, outlineColor } from '../../../style-system/values/materials/color-edge'

const button = '.Button'

// =============================================================================
// 基础样式与交互反馈
// =============================================================================

rules(button, [
  [fontWeight, bold],

  inlineCenter(),

  [$gap, gap],
  [$minHeight, minHeight],
  [$padding, [paddingBlock, paddingInline]],
  [$font, 'inherit'],
  [$fontSize, fontSize],
  [$fontWeight, fontWeight],
  [$lineHeight, lineHeight],
  [$border, [thinBoundary, 'solid', borderColor]],
  [$borderRadius, pill],
  [$backgroundColor, backgroundColor],
  [$color, color],
  [$boxShadow, boxShadow],
  [$cursor, cursor],
  
  [$opacity, opacity],
  [$transform, pressFeedback],
  [$userSelect, 'none'],
  [
    $transition,
    [
      [$backgroundColor, fast, standard],
      [$borderColor, fast, standard],
      [$boxShadow, fast, standard],
      [$color, fast, standard],
      [$opacity, fast, standard],
      [$transform, fast, standard],
    ],
  ],
])

rules(
  [button, $focusVisible],
  [
    [$outlineWidth, focusStroke],
    [$outlineStyle, 'solid'],
    [$outlineColor, outlineColor],
    [$outlineOffset, focusGap],
  ],
)

// =============================================================================
// variant 外观
// =============================================================================

/** bare 使用透明交互底色并移除边缘与阴影重量。 */
rules(
  [button, '&[data-variant="bare"]'],
  [
    [backgroundColor, bareActionSurface],
    [borderColor, 'transparent'],
    [boxShadow, { default: flat, hover: flat, active: flat }],
  ],
)

/** solid 使用动作配色与持续抬升的阴影。 */
rules(
  [button, '&[data-variant="solid"]'],
  [
    [backgroundColor, actionSurface],
    [borderColor, 'transparent'],
    [boxShadow, { default: raised, hover: raised, active: raised }],
    [
      color,
      {
        default: actionForeground,
        hover: actionForeground,
        active: actionForeground,
      },
    ],
  ],
)

// =============================================================================
// tone 语气
// =============================================================================

/** accent 选择强调色系，并让背景与文字读取相同语气。 */
rules(
  [button, '&[data-tone="accent"]'],
  [
    [tone, accent],
    [softTone, softAccent],
    [toneForeground, accentForeground],
    [outlineColor, accentFocus],
    [borderColor, softAccent],
    [backgroundColor, toneSurface],
    [color, { default: tone, hover: toneForeground, active: toneForeground }],
  ],
)

/** danger 选择危险色系，并让背景与文字读取相同语气。 */
rules(
  [button, '&[data-tone="danger"]'],
  [
    [tone, danger],
    [softTone, softDanger],
    [toneForeground, dangerForeground],
    [outlineColor, dangerLine],
    [borderColor, softDanger],
    [backgroundColor, toneSurface],
    [color, { default: tone, hover: toneForeground, active: toneForeground }],
  ],
)

/** 实心语气按钮的禁用文字色仍使用动作前景色。 */
rules([button, '&[data-variant="solid"][data-tone]'], [[color, { disabled: actionForeground }]])

// =============================================================================
// size 尺寸
// =============================================================================

/** 尺寸与排版变量（size：small） */
rules(
  [button, '&[data-size="small"]'],
  [
    [minHeight, small],
    [paddingInline, mediumSpace],
    [paddingBlock, smallSpace],
    [gap, smallSpace],
    [fontSize, normalText],
  ],
)

/** 尺寸与排版变量（size：large） */
rules(
  [button, '&[data-size="large"]'],
  [
    [minHeight, large],
    [paddingInline, wideSpace],
    [paddingBlock, normalSpace],
    [gap, mediumSpace],
    [fontSize, extraLargeText],
  ],
)

/** 尺寸与排版变量（size：xlarge） */
rules(
  [button, '&[data-size="xlarge"]'],
  [
    [minHeight, extraLarge],
    [paddingInline, widestSpace],
    [paddingBlock, mediumSpace],
    [gap, largeSpace],
    [fontSize, heading],
  ],
)

// =============================================================================
// status 状态
// =============================================================================

/** loading 只重定义常态指针；disabled Key 继续使用不可操作指针。 */
rules([button, '&[data-status~="loading"]'], [[cursor, 'progress']])
