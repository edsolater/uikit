/** 按钮的样式配置与注册。 */
import {
  rules,
  declareVariable,
  focusVisible,
  inlineCenter,
} from '../../../style-system'
import { transition } from '../../../style-system/declarations/transition'
import { transformKey, transform } from '../../../style-system/declarations/transform'
import { minHeight } from '../../../style-system/declarations/size'
import { padding } from '../../../style-system/declarations/padding'
import { outlineWidth, outlineStyle, outlineColor, outlineOffset } from '../../../style-system/declarations/outline'
import { opacityKey, opacity } from '../../../style-system/declarations/opacity'
import { gap } from '../../../style-system/declarations/layout'
import { cursor, userSelect } from '../../../style-system/declarations/interaction'
import { font, fontSize, fontWeight, lineHeight } from '../../../style-system/declarations/font'
import { colorKey, color, backgroundColorKey, backgroundColor } from '../../../style-system/declarations/color'
import { boxShadowKey, boxShadow } from '../../../style-system/declarations/box-shadow'
import { borderColorKey, border, borderRadius } from '../../../style-system/declarations/border'
import { foregroundColor } from '../../../style-system/values/materials/color-text'
import { actionForegroundColor, actionColor } from '../../../style-system/values/materials/color-action'
import {
  accentColor,
  accentSoftColor,
  accentForegroundColor,
  accentFocusColor,
  dangerColor,
  dangerSoftColor,
  dangerForegroundColor,
  dangerLineColor,
  toneColor,
  toneSoftColor,
  toneForeground,
  toneBackground,
} from '../../../style-system/values/materials/color-tone'
import { bgColor, transparentInteractionColor } from '../../../style-system/values/materials/color-surface'
import { pillRadius, cornerRadius } from '../../../style-system/values/materials/radius'
import {
  smallSpace,
  normalSpace,
  mediumSpace,
  largeSpace,
  wideSpace,
  widestSpace,
  thinDistance,
  focusOutlineThickness,
  horizontalPadding,
  verticalPadding,
  contentGap,
} from '../../../style-system/values/materials/space'
import {
  smallControlSize,
  largeControlSize,
  xlargeControlSize,
  minimumHeight,
} from '../../../style-system/values/materials/size'
import {
  boldFontWeight,
  normalTextSize,
  xlargeTextSize,
  headingTextSize,
  controlTextSize,
  textWeight,
  textLineHeight,
} from '../../../style-system/values/materials/font'
import { fastDuration, standardEasing } from '../../../style-system/values/materials/motion'
import { flatShadow, raisedShadow, normalShadow } from '../../../style-system/values/materials/shadow'
import { actionCursor, interactionOpacity, pressTransform } from '../../../style-system/values/materials/interaction'
import { edgeColor, focusColor } from '../../../style-system/values/materials/color-edge'

const button = '.Button'

// =============================================================================
// 基础样式与交互反馈
// =============================================================================

rules(button, [
  declareVariable(cornerRadius, pillRadius),
  declareVariable(textWeight, boldFontWeight),
  inlineCenter(),
  gap(contentGap),
  minHeight(minimumHeight),
  padding(verticalPadding, horizontalPadding),
  font('inherit'),
  fontSize(controlTextSize),
  fontWeight(textWeight),
  lineHeight(textLineHeight),
  border(thinDistance, 'solid', edgeColor),
  borderRadius(cornerRadius),
  backgroundColor(bgColor),
  color(foregroundColor),
  boxShadow(normalShadow),
  cursor(actionCursor),
  opacity(interactionOpacity),
  transform(pressTransform),
  userSelect('none'),
  transition(
    [backgroundColorKey, fastDuration, standardEasing],
    [borderColorKey, fastDuration, standardEasing],
    [boxShadowKey, fastDuration, standardEasing],
    [colorKey, fastDuration, standardEasing],
    [opacityKey, fastDuration, standardEasing],
    [transformKey, fastDuration, standardEasing],
  ),
])

rules(
  [button, focusVisible],
  [
    outlineWidth(focusOutlineThickness),
    outlineStyle('solid'),
    outlineColor(focusColor),
    outlineOffset(focusOutlineThickness),
  ],
)

// =============================================================================
// variant 外观
// =============================================================================

/** bare 使用透明交互底色并移除边缘与阴影重量。 */
rules(
  [button, '&[data-variant="bare"]'],
  [
    declareVariable(bgColor, transparentInteractionColor),
    declareVariable(edgeColor, 'transparent'),
    declareVariable(normalShadow, { default: flatShadow, hover: flatShadow, active: flatShadow }),
  ],
)

/** solid 使用动作配色与持续抬升的阴影。 */
rules(
  [button, '&[data-variant="solid"]'],
  [
    declareVariable(bgColor, actionColor),
    declareVariable(edgeColor, 'transparent'),
    declareVariable(normalShadow, { default: raisedShadow, hover: raisedShadow, active: raisedShadow }),
    declareVariable(foregroundColor, {
      default: actionForegroundColor,
      hover: actionForegroundColor,
      active: actionForegroundColor,
    }),
  ],
)

// =============================================================================
// tone 语气
// =============================================================================

/** accent 选择强调色系，并让背景与文字读取相同语气。 */
rules(
  [button, '&[data-tone="accent"]'],
  [
    declareVariable(toneColor, accentColor),
    declareVariable(toneSoftColor, accentSoftColor),
    declareVariable(toneForeground, accentForegroundColor),
    declareVariable(focusColor, accentFocusColor),
    declareVariable(edgeColor, accentSoftColor),
    declareVariable(bgColor, toneBackground),
    declareVariable(foregroundColor, { default: toneColor, hover: toneForeground, active: toneForeground }),
  ],
)

/** danger 选择危险色系，并让背景与文字读取相同语气。 */
rules(
  [button, '&[data-tone="danger"]'],
  [
    declareVariable(toneColor, dangerColor),
    declareVariable(toneSoftColor, dangerSoftColor),
    declareVariable(toneForeground, dangerForegroundColor),
    declareVariable(focusColor, dangerLineColor),
    declareVariable(edgeColor, dangerSoftColor),
    declareVariable(bgColor, toneBackground),
    declareVariable(foregroundColor, { default: toneColor, hover: toneForeground, active: toneForeground }),
  ],
)

/** 实心语气按钮的禁用文字色仍使用动作前景色。 */
rules(
  [button, '&[data-variant="solid"][data-tone]'],
  [declareVariable(foregroundColor, { disabled: actionForegroundColor })],
)

// =============================================================================
// size 尺寸
// =============================================================================

/** 尺寸与排版变量（size：small） */
rules(
  [button, '&[data-size="small"]'],
  [
    declareVariable(minimumHeight, smallControlSize),
    declareVariable(horizontalPadding, mediumSpace),
    declareVariable(verticalPadding, smallSpace),
    declareVariable(contentGap, smallSpace),
    declareVariable(controlTextSize, normalTextSize),
  ],
)

/** 尺寸与排版变量（size：large） */
rules(
  [button, '&[data-size="large"]'],
  [
    declareVariable(minimumHeight, largeControlSize),
    declareVariable(horizontalPadding, wideSpace),
    declareVariable(verticalPadding, normalSpace),
    declareVariable(contentGap, mediumSpace),
    declareVariable(controlTextSize, xlargeTextSize),
  ],
)

/** 尺寸与排版变量（size：xlarge） */
rules(
  [button, '&[data-size="xlarge"]'],
  [
    declareVariable(minimumHeight, xlargeControlSize),
    declareVariable(horizontalPadding, widestSpace),
    declareVariable(verticalPadding, mediumSpace),
    declareVariable(contentGap, largeSpace),
    declareVariable(controlTextSize, headingTextSize),
  ],
)

// =============================================================================
// status 状态
// =============================================================================

/** loading 只重定义常态指针；disabled Key 继续使用不可操作指针。 */
rules([button, '&[data-status~="loading"]'], [declareVariable(actionCursor, 'progress')])
