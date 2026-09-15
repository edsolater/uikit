/** 按主题定义按钮配置，在末尾组装规则；组件执行时按需注册。 */
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
import {
  raisedShadow,
  normalShadow,
  hoverShadow,
  activeShadow,
} from '../../../style-system/values/materials/shadow'
import { disabledOpacity } from '../../../style-system/values/materials/opacity'
import { edgeColor, focusColor } from '../../../style-system/values/materials/color-edge'

// =============================================================================
// 基础样式
// =============================================================================

// --- 作用域取值 ---

// 胶囊圆角与粗字重只在按钮作用域内定义，不改变共享材料。
const buttonVariablesDeclaration = [declareVariable(cornerRadius, pillRadius), declareVariable(textWeight, boldFontWeight)]

// --- 布局与外形 ---

// 内容居中；尺寸、间隔与内边距仍可通过共享变量覆盖。
const buttonLayout = [inlineCenter(), gap(contentGap), minHeight(minimumHeight), padding(verticalPadding, horizontalPadding)]

// 细实线边缘与圆角。
const buttonShape = [border(thinDistance, 'solid', edgeColor), borderRadius(cornerRadius)]

// --- 文字与外观 ---

// 继承字体后，应用可独立覆盖的字号、字重与行高。
const buttonTypography = [font('inherit'), fontSize(controlTextSize), fontWeight(textWeight), lineHeight(textLineHeight)]

// 默认底色、文字色与阴影。
const buttonAppearance = [backgroundColor(bgColor), color(foregroundColor), boxShadow(normalShadow)]

// =============================================================================
// 交互反馈
// =============================================================================

// --- 指针与过渡 ---

// 可点击提示，并避免点击时选中文字。
const buttonInteraction = [cursor('pointer'), userSelect('none')]

/** 按钮颜色、阴影、透明度与位移的过渡；不让尺寸跟着补间。 */
const buttonTransition = transition(
  [backgroundColorKey, fastDuration, standardEasing],
  [borderColorKey, fastDuration, standardEasing],
  [boxShadowKey, fastDuration, standardEasing],
  [colorKey, fastDuration, standardEasing],
  [opacityKey, fastDuration, standardEasing],
  [transformKey, fastDuration, standardEasing],
)

// --- 悬停、按下与焦点 ---

/** 按钮悬停时切换底色、文字色和阴影。 */
const hoverStyle = styleRule(stateHover)

const buttonHoverAppearance = [backgroundColor(bgHoverColor), color(foregroundHoverColor), boxShadow(hoverShadow)]

/** 按钮按下时切换外观，并向下移动一个细边界厚度。 */
const activeStyle = styleRule(stateActive)

const buttonActiveAppearance = [
  backgroundColor(bgActiveColor),
  color(foregroundActiveColor),
  boxShadow(activeShadow),
  transform(translateY(thinDistance)),
]

/** 键盘焦点轮廓不占布局空间，与按钮边缘留出间隔。 */
const focusStyle = styleRule(focusVisible)

const buttonFocusOutline = [
  outlineWidth(focusOutlineThickness),
  outlineStyle('solid'),
  outlineColor(focusColor),
  outlineOffset(focusOutlineThickness),
]

// =============================================================================
// 外观变体
// =============================================================================

// --- 裸式 ---

/** 裸底按钮退去背景与阴影，只在交互时提示位置。 */
const bareStyle = styleRule('&[data-variant="bare"]')

const buttonBareAppearance = [backgroundColor('transparent'), border(thinDistance, 'solid', 'transparent'), boxShadow('none')]

/** 裸底按钮悬停时使用浅色覆盖层。 */
const bareHoverStyle = styleRule(stateHover)

const buttonBareHoverAppearance = [backgroundColor(hoverOverlayColor), boxShadow('none')]

/** 裸底按钮按下时加深覆盖层。 */
const bareActiveStyle = styleRule(stateActive)

const buttonBareActiveAppearance = [backgroundColor(activeOverlayColor), boxShadow('none')]

// --- 实心 ---

/** 实心按钮使用动作底色和抬升阴影。 */
const solidStyle = styleRule('&[data-variant="solid"]')

const buttonSolidAppearance = [
  backgroundColor(actionColor),
  border(thinDistance, 'solid', 'transparent'),
  boxShadow(raisedShadow),
  color(actionForegroundColor),
]

/** 实心按钮悬停时保持实心外观。 */
const solidHoverStyle = styleRule(stateHover)

const buttonSolidHoverAppearance = [backgroundColor(actionHoverColor), color(actionForegroundColor), boxShadow(raisedShadow)]

/** 实心按钮按下时保持动作前景色和阴影。 */
const solidActiveStyle = styleRule(stateActive)

const buttonSolidActiveAppearance = [backgroundColor(actionActiveColor), color(actionForegroundColor), boxShadow(raisedShadow)]

// =============================================================================
// 语义色调
// =============================================================================

// --- 强调操作 ---

/** 强调按钮定义语气配色；外观变体不决定语气。 */
const accentStyle = styleRule('&[data-tone="accent"]')

const buttonAccentVariablesDeclaration = [
  declareVariable(toneColor, accentColor),
  declareVariable(toneSoftColor, accentSoftColor),
  declareVariable(toneForeground, accentForegroundColor),
  declareVariable(focusColor, accentFocusColor),
  declareVariable(edgeColor, accentSoftColor),
]

// 边缘、背景与文字消费当前作用域的语气值。
const buttonAccentAppearance = [border(thinDistance, 'solid', edgeColor), backgroundColor(toneBackground), color(toneColor)]

/** 强调按钮悬停时增加语气色占比。 */
const accentHoverStyle = styleRule(stateHover)

const buttonAccentHoverAppearance = [backgroundColor(toneHoverBackground), color(toneForeground)]

/** 强调按钮按下时继续加深语气色。 */
const accentActiveStyle = styleRule(stateActive)

const buttonAccentActiveAppearance = [backgroundColor(toneActiveBackground), color(toneForeground)]

// --- 危险操作 ---

/** 危险按钮定义语气配色；外观变体不决定语气。 */
const dangerStyle = styleRule('&[data-tone="danger"]')

const buttonDangerVariablesDeclaration = [
  declareVariable(toneColor, dangerColor),
  declareVariable(toneSoftColor, dangerSoftColor),
  declareVariable(toneForeground, dangerForegroundColor),
  declareVariable(focusColor, dangerLineColor),
  declareVariable(edgeColor, dangerSoftColor),
]

// 边缘、背景与文字消费当前作用域的语气值。
const buttonDangerAppearance = [border(thinDistance, 'solid', edgeColor), backgroundColor(toneBackground), color(toneColor)]

/** 危险按钮悬停时增加语气色占比。 */
const dangerHoverStyle = styleRule(stateHover)

const buttonDangerHoverAppearance = [backgroundColor(toneHoverBackground), color(toneForeground)]

/** 危险按钮按下时继续加深语气色。 */
const dangerActiveStyle = styleRule(stateActive)

const buttonDangerActiveAppearance = [backgroundColor(toneActiveBackground), color(toneForeground)]

// --- 实心与色调组合 ---

/** 实心且带语气时使用动作前景色；此条件比禁用分支更具体。 */
const solidToneStyle = styleRule('&[data-variant="solid"][data-tone]')

const buttonSolidToneForeground = color(actionForegroundColor)

// =============================================================================
// 尺寸
// =============================================================================

// --- 小号 ---

/** 小号按钮同步调整高度、内边距、内容间距与字号。 */
const smallStyle = styleRule('&[data-size="small"]')

const buttonSmallVariablesDeclaration = [
  declareVariable(minimumHeight, smallControlSize),
  declareVariable(horizontalPadding, mediumSpace),
  declareVariable(verticalPadding, smallSpace),
  declareVariable(contentGap, smallSpace),
  declareVariable(controlTextSize, normalTextSize),
]

// --- 大号 ---

/** 大号按钮同步调整高度、内边距、内容间距与字号。 */
const largeStyle = styleRule('&[data-size="large"]')

const buttonLargeVariablesDeclaration = [
  declareVariable(minimumHeight, largeControlSize),
  declareVariable(horizontalPadding, wideSpace),
  declareVariable(verticalPadding, normalSpace),
  declareVariable(contentGap, mediumSpace),
  declareVariable(controlTextSize, xlargeTextSize),
]

// --- 超大号 ---

/** 超大号按钮同步调整高度、内边距、内容间距与字号。 */
const xlargeStyle = styleRule('&[data-size="xlarge"]')

const buttonXlargeVariablesDeclaration = [
  declareVariable(minimumHeight, xlargeControlSize),
  declareVariable(horizontalPadding, widestSpace),
  declareVariable(verticalPadding, mediumSpace),
  declareVariable(contentGap, largeSpace),
  declareVariable(controlTextSize, headingTextSize),
]

// =============================================================================
// 状态
// =============================================================================

// --- 加载 ---

/** 加载只提示忙碌，不阻止事件。 */
const loadingStyle = styleRule('&[data-status~="loading"]')

const buttonLoadingCursor = cursor('progress')

// --- 禁用 ---

/** 禁用兼顾原生属性与状态标记，淡化外观并移除阴影和位移。 */
const disabledStyle = styleRule('&:disabled, &[data-status~="disabled"]')

const buttonDisabledAppearance = [
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

hoverStyle.of(buttonHoverAppearance)

activeStyle.of(buttonActiveAppearance)

focusStyle.of(buttonFocusOutline)

// --- 外观变体 ---

bareHoverStyle.of(buttonBareHoverAppearance)

bareActiveStyle.of(buttonBareActiveAppearance)

bareStyle.of(buttonBareAppearance, bareHoverStyle, bareActiveStyle)

solidHoverStyle.of(buttonSolidHoverAppearance)

solidActiveStyle.of(buttonSolidActiveAppearance)

solidStyle.of(buttonSolidAppearance, solidHoverStyle, solidActiveStyle)

// --- 语义色调 ---

accentHoverStyle.of(buttonAccentHoverAppearance)

accentActiveStyle.of(buttonAccentActiveAppearance)

accentStyle.of(
  buttonAccentVariablesDeclaration,
  buttonAccentAppearance,
  accentHoverStyle,
  accentActiveStyle,
)

dangerHoverStyle.of(buttonDangerHoverAppearance)

dangerActiveStyle.of(buttonDangerActiveAppearance)

dangerStyle.of(
  buttonDangerVariablesDeclaration,
  buttonDangerAppearance,
  dangerHoverStyle,
  dangerActiveStyle,
)

solidToneStyle.of(buttonSolidToneForeground)

// --- 尺寸与状态 ---

smallStyle.of(buttonSmallVariablesDeclaration)

largeStyle.of(buttonLargeVariablesDeclaration)

xlargeStyle.of(buttonXlargeVariablesDeclaration)

loadingStyle.of(buttonLoadingCursor)

disabledStyle.of(buttonDisabledAppearance)

// --- 按钮根规则 ---

/** 按钮的完整规则；实心与色调组合的文字色优先于禁用分支。 */
const kitStyle = styleRule('.Button')
kitStyle.of(
  buttonVariablesDeclaration,
  buttonLayout,
  buttonShape,
  buttonTypography,
  buttonAppearance,
  buttonInteraction,
  buttonTransition,
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

/** 浏览器宿主须先提供 style#css-root；服务器端只保留定义。 */
export function registerButtonStyle(): void {
  if (typeof document === 'undefined') return
  cssRoot.activate(kitStyle)
}
