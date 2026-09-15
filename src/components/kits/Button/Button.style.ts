/** 按钮的样式配置与注册。 */
import {
  styleRule,
  cssRoot,
  declareVariable,
  focusVisible,
  stateHover,
  stateActive,
  inlineCenter,
} from '../../../style-system'
import { transition } from '../../../style-system/declarations/transition'
import { transformKey, transform } from '../../../style-system/declarations/transform'
import { translateY } from '../../../style-system/values/functions/transform'
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
import { baseSurfaceColor } from '../../../style-system/values/materials/color-palette'
import {
  defaultForegroundColor,
  foregroundColor,
  foregroundHoverColor,
  foregroundActiveColor,
} from '../../../style-system/values/materials/color-text'
import {
  actionForegroundColor,
  actionColor,
  actionHoverColor,
  actionActiveColor,
} from '../../../style-system/values/materials/color-action'
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
  toneHoverBackground,
  toneActiveBackground,
} from '../../../style-system/values/materials/color-tone'
import {
  bgColor,
  bgHoverColor,
  bgActiveColor,
  hoverOverlayColor,
  activeOverlayColor,
} from '../../../style-system/values/materials/color-surface'
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
import { raisedShadow, normalShadow, hoverShadow, activeShadow } from '../../../style-system/values/materials/shadow'
import { disabledOpacity } from '../../../style-system/values/materials/opacity'
import { edgeColor, focusColor } from '../../../style-system/values/materials/color-edge'

// =============================================================================
// 基础样式
// =============================================================================

/** 组件变量定义：圆角、字重 */
const variables = [declareVariable(cornerRadius, pillRadius), declareVariable(textWeight, boldFontWeight)]

/** 尺寸、空间与定位 */
const baseLayout = [
  inlineCenter(),
  gap(contentGap),
  minHeight(minimumHeight),
  padding(verticalPadding, horizontalPadding),
]

/** 文字排版 */
const typography = [font('inherit'), fontSize(controlTextSize), fontWeight(textWeight), lineHeight(textLineHeight)]

/** 默认外观 */
const appearance = [
  border(thinDistance, 'solid', edgeColor),
  borderRadius(cornerRadius),
  backgroundColor(bgColor),
  color(foregroundColor),
  boxShadow(normalShadow),
]

/** 状态切换的过渡效果 */
const baseTransition = transition(
  [backgroundColorKey, fastDuration, standardEasing],
  [borderColorKey, fastDuration, standardEasing],
  [boxShadowKey, fastDuration, standardEasing],
  [colorKey, fastDuration, standardEasing],
  [opacityKey, fastDuration, standardEasing],
  [transformKey, fastDuration, standardEasing],
)

// =============================================================================
// 交互反馈
// =============================================================================

/** 指针与文本选择 */
const interaction = [cursor('pointer'), userSelect('none')]

/** 外观（state：hover） */
const appearanceWhenHover = [backgroundColor(bgHoverColor), color(foregroundHoverColor), boxShadow(hoverShadow)]

/** 外观（state：active） */
const appearanceWhenActive = [
  backgroundColor(bgActiveColor),
  color(foregroundActiveColor),
  boxShadow(activeShadow),
  transform(translateY(thinDistance)),
]

/** 外观（state：focus-visible） */
const appearanceWhenFocus = [
  outlineWidth(focusOutlineThickness),
  outlineStyle('solid'),
  outlineColor(focusColor),
  outlineOffset(focusOutlineThickness),
]

// =============================================================================
// variant 外观
// =============================================================================

// --- variant:bare ---

/** 外观（variant：bare） */
const appearanceWhenBare = [
  backgroundColor('transparent'),
  border(thinDistance, 'solid', 'transparent'),
  boxShadow('none'),
]

/** 外观（variant：bare，state：hover） */
const appearanceWhenBareAndHover = [backgroundColor(hoverOverlayColor), boxShadow('none')]

/** 外观（variant：bare，state：active） */
const appearanceWhenBareAndActive = [backgroundColor(activeOverlayColor), boxShadow('none')]

// --- variant:solid ---

/** 外观（variant：solid） */
const appearanceWhenSolid = [
  backgroundColor(actionColor),
  border(thinDistance, 'solid', 'transparent'),
  boxShadow(raisedShadow),
  color(actionForegroundColor),
]

/** 外观（variant：solid，state：hover） */
const appearanceWhenSolidAndHover = [
  backgroundColor(actionHoverColor),
  color(actionForegroundColor),
  boxShadow(raisedShadow),
]

/** 外观（variant：solid，state：active） */
const appearanceWhenSolidAndActive = [
  backgroundColor(actionActiveColor),
  color(actionForegroundColor),
  boxShadow(raisedShadow),
]

// =============================================================================
// tone 语气
// =============================================================================

// --- tone:accent ---

/** 配色变量（tone：accent） */
const variablesWhenAccent = [
  declareVariable(toneColor, accentColor),
  declareVariable(toneSoftColor, accentSoftColor),
  declareVariable(toneForeground, accentForegroundColor),
  declareVariable(focusColor, accentFocusColor),
  declareVariable(edgeColor, accentSoftColor),
]

/** 外观（tone：accent） */
const appearanceWhenAccent = [
  border(thinDistance, 'solid', edgeColor),
  backgroundColor(toneBackground),
  color(toneColor),
]

/** 外观（tone：accent，state：hover） */
const appearanceWhenAccentAndHover = [backgroundColor(toneHoverBackground), color(toneForeground)]

/** 外观（tone：accent，state：active） */
const appearanceWhenAccentAndActive = [backgroundColor(toneActiveBackground), color(toneForeground)]

// --- tone:danger ---

/** 配色变量（tone：danger） */
const variablesWhenDanger = [
  declareVariable(toneColor, dangerColor),
  declareVariable(toneSoftColor, dangerSoftColor),
  declareVariable(toneForeground, dangerForegroundColor),
  declareVariable(focusColor, dangerLineColor),
  declareVariable(edgeColor, dangerSoftColor),
]

/** 外观（tone：danger） */
const appearanceWhenDanger = [
  border(thinDistance, 'solid', edgeColor),
  backgroundColor(toneBackground),
  color(toneColor),
]

/** 外观（tone：danger，state：hover） */
const appearanceWhenDangerAndHover = [backgroundColor(toneHoverBackground), color(toneForeground)]

/** 外观（tone：danger，state：active） */
const appearanceWhenDangerAndActive = [backgroundColor(toneActiveBackground), color(toneForeground)]

// --- variant:solid + tone ---

/** 文字色（variant：solid，tone：accent 或 danger；优先于禁用色） */
const foregroundWhenSolidWithTone = color(actionForegroundColor)

// =============================================================================
// size 尺寸
// =============================================================================

// --- size:small ---

/** 尺寸与排版变量（size：small） */
const variablesWhenSmall = [
  declareVariable(minimumHeight, smallControlSize),
  declareVariable(horizontalPadding, mediumSpace),
  declareVariable(verticalPadding, smallSpace),
  declareVariable(contentGap, smallSpace),
  declareVariable(controlTextSize, normalTextSize),
]

// --- size:large ---

/** 尺寸与排版变量（size：large） */
const variablesWhenLarge = [
  declareVariable(minimumHeight, largeControlSize),
  declareVariable(horizontalPadding, wideSpace),
  declareVariable(verticalPadding, normalSpace),
  declareVariable(contentGap, mediumSpace),
  declareVariable(controlTextSize, xlargeTextSize),
]

// --- size:xlarge ---

/** 尺寸与排版变量（size：xlarge） */
const variablesWhenXlarge = [
  declareVariable(minimumHeight, xlargeControlSize),
  declareVariable(horizontalPadding, widestSpace),
  declareVariable(verticalPadding, mediumSpace),
  declareVariable(contentGap, largeSpace),
  declareVariable(controlTextSize, headingTextSize),
]

// =============================================================================
// status 状态
// =============================================================================

// --- status:loading ---

/** 指针（state：loading） */
const interactionWhenLoading = cursor('progress')

// --- status:disabled ---

/** 外观（state：disabled） */
const appearanceWhenDisabled = [
  backgroundColor(baseSurfaceColor),
  color(defaultForegroundColor),
  boxShadow('none'),
  cursor('not-allowed'),
  opacity(disabledOpacity),
  transform('none'),
]

// =============================================================================
// 样式组装
// =============================================================================

// --- 交互反馈 ---

const hoverStyle = styleRule(stateHover)
hoverStyle.of(appearanceWhenHover)

const activeStyle = styleRule(stateActive)
activeStyle.of(appearanceWhenActive)

const focusStyle = styleRule(focusVisible)
focusStyle.of(appearanceWhenFocus)

// --- variant 外观 ---

const bareHoverStyle = styleRule(stateHover)
bareHoverStyle.of(appearanceWhenBareAndHover)

const bareActiveStyle = styleRule(stateActive)
bareActiveStyle.of(appearanceWhenBareAndActive)

const bareStyle = styleRule('&[data-variant="bare"]')
bareStyle.of(appearanceWhenBare, bareHoverStyle, bareActiveStyle)

const solidHoverStyle = styleRule(stateHover)
solidHoverStyle.of(appearanceWhenSolidAndHover)

const solidActiveStyle = styleRule(stateActive)
solidActiveStyle.of(appearanceWhenSolidAndActive)

const solidStyle = styleRule('&[data-variant="solid"]')
solidStyle.of(appearanceWhenSolid, solidHoverStyle, solidActiveStyle)

// --- tone 语气 ---

const accentHoverStyle = styleRule(stateHover)
accentHoverStyle.of(appearanceWhenAccentAndHover)

const accentActiveStyle = styleRule(stateActive)
accentActiveStyle.of(appearanceWhenAccentAndActive)

const accentStyle = styleRule('&[data-tone="accent"]')
accentStyle.of(variablesWhenAccent, appearanceWhenAccent, accentHoverStyle, accentActiveStyle)

const dangerHoverStyle = styleRule(stateHover)
dangerHoverStyle.of(appearanceWhenDangerAndHover)

const dangerActiveStyle = styleRule(stateActive)
dangerActiveStyle.of(appearanceWhenDangerAndActive)

const dangerStyle = styleRule('&[data-tone="danger"]')
dangerStyle.of(variablesWhenDanger, appearanceWhenDanger, dangerHoverStyle, dangerActiveStyle)

const solidToneStyle = styleRule('&[data-variant="solid"][data-tone]')
solidToneStyle.of(foregroundWhenSolidWithTone)

// --- size 与 status ---

const smallStyle = styleRule('&[data-size="small"]')
smallStyle.of(variablesWhenSmall)

const largeStyle = styleRule('&[data-size="large"]')
largeStyle.of(variablesWhenLarge)

const xlargeStyle = styleRule('&[data-size="xlarge"]')
xlargeStyle.of(variablesWhenXlarge)

const loadingStyle = styleRule('&[data-status~="loading"]')
loadingStyle.of(interactionWhenLoading)

const disabledStyle = styleRule('&:disabled, &[data-status~="disabled"]')
disabledStyle.of(appearanceWhenDisabled)

// --- 按钮根规则 ---

const kitStyle = styleRule('.Button')
kitStyle.of(
  variables,
  baseLayout,
  typography,
  appearance,
  interaction,
  baseTransition,
  hoverStyle,
  activeStyle,
  focusStyle,
  bareStyle,
  solidStyle,
  accentStyle,
  dangerStyle,
  solidToneStyle,
  smallStyle,
  largeStyle,
  xlargeStyle,
  loadingStyle,
  disabledStyle,
)

// --- 按需注册 ---

/** 注册按钮样式；浏览器须先提供 style#css-root，服务器端跳过。 */
export function registerButtonStyle(): void {
  if (typeof document === 'undefined') return
  cssRoot.activate(kitStyle)
}
