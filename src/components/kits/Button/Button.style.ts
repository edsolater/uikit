/** Button 的样式入口；每个分支在接入处公开自身，允许独立补充内容。 */
import {
  styleRule,
  cssRoot,
  declareVariable,
  focusVisible,
  stateHover,
  stateActive,
  inlineCenter,
} from '../../../style-system'
import { transitionValue, transition } from '../../../style-system/css-properties/transition'
import { transformKey, transform, translateY } from '../../../style-system/css-properties/transform'
import { minHeight } from '../../../style-system/css-properties/size'
import { padding } from '../../../style-system/css-properties/padding'
import { outlineWidth, outlineStyle, outlineColor, outlineOffset } from '../../../style-system/css-properties/outline'
import { opacityKey, opacity } from '../../../style-system/css-properties/opacity'
import { gap } from '../../../style-system/css-properties/layout'
import { cursor, userSelect } from '../../../style-system/css-properties/interaction'
import { font, fontSize, fontWeight, lineHeight } from '../../../style-system/css-properties/font'
import { colorKey, color, backgroundColorKey, backgroundColor } from '../../../style-system/css-properties/color'
import { boxShadowKey, boxShadow } from '../../../style-system/css-properties/box-shadow'
import { borderColorKey, border, borderRadius } from '../../../style-system/css-properties/border'
import {
  baseSurfaceColor,
  foregroundColor,
  actionForegroundColor,
  accentColor,
  accentSoftColor,
  accentForegroundColor,
  accentFocusColor,
  dangerColor,
  dangerSoftColor,
  dangerForegroundColor,
  dangerLineColor,
} from '../../../style-system/css-values/color-theme'
import {
  bgColor,
  bgHoverColor,
  bgActiveColor,
  fgColor,
  fgHoverColor,
  fgActiveColor,
  actionColor,
  actionHoverColor,
  actionActiveColor,
} from '../../../style-system/css-values/color-surface'
import {
  toneColor,
  toneSoftColor,
  toneForeground,
  toneBackground,
  toneHoverBackground,
  toneActiveBackground,
} from '../../../style-system/css-values/color-tone'
import { hoverOverlay, activeOverlay } from '../../../style-system/css-values/color-overlay'
import { pillRadius } from '../../../style-system/css-values/dimension-scale'
import {
  smallSpace,
  normalSpace,
  mediumSpace,
  largeSpace,
  wideSpace,
  widestSpace,
  smallSize,
  largeSize,
  xlargeSize,
  thinBoundary,
  focusBoundary,
} from '../../../style-system/css-values/dimension-theme'
import {
  minimumHeight,
  horizontalPadding,
  verticalPadding,
  contentGap,
} from '../../../style-system/css-values/dimension-spacing'
import { boldWeight } from '../../../style-system/css-values/font-scale'
import {
  normalTextSize,
  xlargeTextSize,
  headingTextSize,
  controlTextSize,
  textWeight,
  textLineHeight,
} from '../../../style-system/css-values/font-theme'
import { fastDuration, standardEasing } from '../../../style-system/css-values/motion-theme'
import { raisedShadow } from '../../../style-system/css-values/shadow-theme'
import { disabledOpacity } from '../../../style-system/css-values/opacity'
import {
  cornerRadius,
  edgeColor,
  focusColor,
  shadow,
  hoverShadow,
  activeShadow,
} from '../../../style-system/css-values/appearance'

/**
 * 按钮的基础规则及扩展入口。
 * 实心与语气组合的前景色优先级高于禁用分支。
 */
export const kitStyle = styleRule('.Button')

// 胶囊圆角与粗字重只在按钮作用域内定义，不改变共享材料。
const buttonVariablesDeclaration = [declareVariable(cornerRadius, pillRadius), declareVariable(textWeight, boldWeight)]
kitStyle.of(buttonVariablesDeclaration)

// 内容居中；尺寸、间隔与内边距仍可通过共享变量覆盖。
const buttonLayout = [inlineCenter(), gap(contentGap), minHeight(minimumHeight), padding(verticalPadding, horizontalPadding)]
kitStyle.of(buttonLayout)

// 细实线边缘与圆角。
const buttonShape = [border(thinBoundary, 'solid', edgeColor), borderRadius(cornerRadius)]
kitStyle.of(buttonShape)

// 继承字体后，应用可独立覆盖的字号、字重与行高。
const buttonTypography = [font('inherit'), fontSize(controlTextSize), fontWeight(textWeight), lineHeight(textLineHeight)]
kitStyle.of(buttonTypography)

// 默认底色、文字色与阴影。
const buttonAppearance = [backgroundColor(bgColor), color(fgColor), boxShadow(shadow)]
kitStyle.of(buttonAppearance)

// 可点击提示；平滑过渡颜色、阴影、透明度与位移，不让尺寸跟着补间。
const buttonInteraction = [
  cursor('pointer'),
  userSelect('none'),
  transition(
    [backgroundColorKey, borderColorKey, boxShadowKey, colorKey, opacityKey, transformKey].map((property) =>
      transitionValue(property, fastDuration, standardEasing),
    ),
  ),
]
kitStyle.of(buttonInteraction)

/** 按钮悬停时切换底色、文字色和阴影。 */
export const hoverStyle = styleRule(stateHover)
kitStyle.of(hoverStyle)

const buttonHoverAppearance = [backgroundColor(bgHoverColor), color(fgHoverColor), boxShadow(hoverShadow)]
hoverStyle.of(buttonHoverAppearance)

/** 按钮按下时切换外观，并向下移动一个细边界厚度。 */
export const activeStyle = styleRule(stateActive)
kitStyle.of(activeStyle)

const buttonActiveAppearance = [
  backgroundColor(bgActiveColor),
  color(fgActiveColor),
  boxShadow(activeShadow),
  transform(translateY(thinBoundary)),
]
activeStyle.of(buttonActiveAppearance)

/** 键盘焦点轮廓不占布局空间，与按钮边缘留出间隔。 */
export const focusStyle = styleRule(focusVisible)
kitStyle.of(focusStyle)

const buttonFocusOutline = [
  outlineWidth(focusBoundary),
  outlineStyle('solid'),
  outlineColor(focusColor),
  outlineOffset(focusBoundary),
]
focusStyle.of(buttonFocusOutline)

/** 裸底按钮退去背景与阴影，只在交互时提示位置。 */
export const bareStyle = styleRule('&[data-variant="bare"]')
kitStyle.of(bareStyle)

const buttonBareAppearance = [backgroundColor('transparent'), border(thinBoundary, 'solid', 'transparent'), boxShadow('none')]
bareStyle.of(buttonBareAppearance)

/** 裸底按钮悬停时使用浅色覆盖层。 */
export const bareHoverStyle = styleRule(stateHover)
bareStyle.of(bareHoverStyle)

const buttonBareHoverAppearance = [backgroundColor(hoverOverlay), boxShadow('none')]
bareHoverStyle.of(buttonBareHoverAppearance)

/** 裸底按钮按下时加深覆盖层。 */
export const bareActiveStyle = styleRule(stateActive)
bareStyle.of(bareActiveStyle)

const buttonBareActiveAppearance = [backgroundColor(activeOverlay), boxShadow('none')]
bareActiveStyle.of(buttonBareActiveAppearance)

/** 实心按钮使用动作底色和抬升阴影。 */
export const solidStyle = styleRule('&[data-variant="solid"]')
kitStyle.of(solidStyle)

const buttonSolidAppearance = [
  backgroundColor(actionColor),
  border(thinBoundary, 'solid', 'transparent'),
  boxShadow(raisedShadow),
  color(actionForegroundColor),
]
solidStyle.of(buttonSolidAppearance)

/** 实心按钮悬停时保持实心外观。 */
export const solidHoverStyle = styleRule(stateHover)
solidStyle.of(solidHoverStyle)

const buttonSolidHoverAppearance = [backgroundColor(actionHoverColor), color(actionForegroundColor), boxShadow(raisedShadow)]
solidHoverStyle.of(buttonSolidHoverAppearance)

/** 实心按钮按下时保持动作前景色和阴影。 */
export const solidActiveStyle = styleRule(stateActive)
solidStyle.of(solidActiveStyle)

const buttonSolidActiveAppearance = [backgroundColor(actionActiveColor), color(actionForegroundColor), boxShadow(raisedShadow)]
solidActiveStyle.of(buttonSolidActiveAppearance)

/** 强调按钮定义语气配色；外观变体不决定语气。 */
export const accentStyle = styleRule('&[data-tone="accent"]')
kitStyle.of(accentStyle)

const buttonAccentVariablesDeclaration = [
  declareVariable(toneColor, accentColor),
  declareVariable(toneSoftColor, accentSoftColor),
  declareVariable(toneForeground, accentForegroundColor),
  declareVariable(focusColor, accentFocusColor),
  declareVariable(edgeColor, accentSoftColor),
]
accentStyle.of(buttonAccentVariablesDeclaration)

// 边缘、背景与文字消费当前作用域的语气值。
const buttonAccentAppearance = [border(thinBoundary, 'solid', edgeColor), backgroundColor(toneBackground), color(toneColor)]
accentStyle.of(buttonAccentAppearance)

/** 强调按钮悬停时增加语气色占比。 */
export const accentHoverStyle = styleRule(stateHover)
accentStyle.of(accentHoverStyle)

const buttonAccentHoverAppearance = [backgroundColor(toneHoverBackground), color(toneForeground)]
accentHoverStyle.of(buttonAccentHoverAppearance)

/** 强调按钮按下时继续加深语气色。 */
export const accentActiveStyle = styleRule(stateActive)
accentStyle.of(accentActiveStyle)

const buttonAccentActiveAppearance = [backgroundColor(toneActiveBackground), color(toneForeground)]
accentActiveStyle.of(buttonAccentActiveAppearance)

/** 危险按钮定义语气配色；外观变体不决定语气。 */
export const dangerStyle = styleRule('&[data-tone="danger"]')
kitStyle.of(dangerStyle)

const buttonDangerVariablesDeclaration = [
  declareVariable(toneColor, dangerColor),
  declareVariable(toneSoftColor, dangerSoftColor),
  declareVariable(toneForeground, dangerForegroundColor),
  declareVariable(focusColor, dangerLineColor),
  declareVariable(edgeColor, dangerSoftColor),
]
dangerStyle.of(buttonDangerVariablesDeclaration)

// 边缘、背景与文字消费当前作用域的语气值。
const buttonDangerAppearance = [border(thinBoundary, 'solid', edgeColor), backgroundColor(toneBackground), color(toneColor)]
dangerStyle.of(buttonDangerAppearance)

/** 危险按钮悬停时增加语气色占比。 */
export const dangerHoverStyle = styleRule(stateHover)
dangerStyle.of(dangerHoverStyle)

const buttonDangerHoverAppearance = [backgroundColor(toneHoverBackground), color(toneForeground)]
dangerHoverStyle.of(buttonDangerHoverAppearance)

/** 危险按钮按下时继续加深语气色。 */
export const dangerActiveStyle = styleRule(stateActive)
dangerStyle.of(dangerActiveStyle)

const buttonDangerActiveAppearance = [backgroundColor(toneActiveBackground), color(toneForeground)]
dangerActiveStyle.of(buttonDangerActiveAppearance)

/** 实心且带语气时使用动作前景色；此条件比禁用分支更具体。 */
export const solidToneStyle = styleRule('&[data-variant="solid"][data-tone]')
kitStyle.of(solidToneStyle)

const buttonSolidToneForeground = color(actionForegroundColor)
solidToneStyle.of(buttonSolidToneForeground)

/** 小号按钮同步调整高度、内边距、内容间距与字号。 */
export const smallStyle = styleRule('&[data-size="small"]')
kitStyle.of(smallStyle)

const buttonSmallVariablesDeclaration = [
  declareVariable(minimumHeight, smallSize),
  declareVariable(horizontalPadding, mediumSpace),
  declareVariable(verticalPadding, smallSpace),
  declareVariable(contentGap, smallSpace),
  declareVariable(controlTextSize, normalTextSize),
]
smallStyle.of(buttonSmallVariablesDeclaration)

/** 大号按钮同步调整高度、内边距、内容间距与字号。 */
export const largeStyle = styleRule('&[data-size="large"]')
kitStyle.of(largeStyle)

const buttonLargeVariablesDeclaration = [
  declareVariable(minimumHeight, largeSize),
  declareVariable(horizontalPadding, wideSpace),
  declareVariable(verticalPadding, normalSpace),
  declareVariable(contentGap, mediumSpace),
  declareVariable(controlTextSize, xlargeTextSize),
]
largeStyle.of(buttonLargeVariablesDeclaration)

/** 超大号按钮同步调整高度、内边距、内容间距与字号。 */
export const xlargeStyle = styleRule('&[data-size="xlarge"]')
kitStyle.of(xlargeStyle)

const buttonXlargeVariablesDeclaration = [
  declareVariable(minimumHeight, xlargeSize),
  declareVariable(horizontalPadding, widestSpace),
  declareVariable(verticalPadding, mediumSpace),
  declareVariable(contentGap, largeSpace),
  declareVariable(controlTextSize, headingTextSize),
]
xlargeStyle.of(buttonXlargeVariablesDeclaration)

/** 加载只提示忙碌，不阻止事件。 */
export const loadingStyle = styleRule('&[data-status~="loading"]')
kitStyle.of(loadingStyle)

const buttonLoadingCursor = cursor('progress')
loadingStyle.of(buttonLoadingCursor)

/** 禁用兼顾原生属性与状态标记，淡化外观并移除阴影和位移。 */
export const disabledStyle = styleRule('&:disabled, &[data-status~="disabled"]')
kitStyle.of(disabledStyle)

const buttonDisabledAppearance = [
  backgroundColor(baseSurfaceColor),
  color(foregroundColor),
  boxShadow('none'),
  cursor('not-allowed'),
  opacity(disabledOpacity),
  transform('none'),
]
disabledStyle.of(buttonDisabledAppearance)

/** 浏览器宿主须先提供 style#css-root；服务器端只保留定义。 */
export function registerButtonStyle(): void {
  if (typeof document === 'undefined') return
  cssRoot.activate(kitStyle)
}
