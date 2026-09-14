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
export const kitRoot = styleRule('.Button')

// 胶囊圆角与粗字重只在按钮作用域内定义，不改变共享材料。
kitRoot.attach(declareVariable(cornerRadius, pillRadius), declareVariable(textWeight, boldWeight))

// 内容居中；尺寸、间隔与内边距仍可通过共享变量覆盖。
kitRoot.attach(inlineCenter(), gap(contentGap), minHeight(minimumHeight), padding(verticalPadding, horizontalPadding))

// 细实线边缘与圆角。
kitRoot.attach(border(thinBoundary, 'solid', edgeColor), borderRadius(cornerRadius))

// 继承字体后，应用可独立覆盖的字号、字重与行高。
kitRoot.attach(font('inherit'), fontSize(controlTextSize), fontWeight(textWeight), lineHeight(textLineHeight))

// 默认底色、文字色与阴影。
kitRoot.attach(backgroundColor(bgColor), color(fgColor), boxShadow(shadow))

// 可点击提示；平滑过渡颜色、阴影、透明度与位移，不让尺寸跟着补间。
kitRoot.attach(
  cursor('pointer'),
  userSelect('none'),
  transition(
    [backgroundColorKey, borderColorKey, boxShadowKey, colorKey, opacityKey, transformKey].map((property) =>
      transitionValue(property, fastDuration, standardEasing),
    ),
  ),
)

/** 按钮悬停时切换底色、文字色和阴影。 */
export const hoverStyle = styleRule(stateHover)
kitRoot.attach(hoverStyle)

hoverStyle.attach(backgroundColor(bgHoverColor), color(fgHoverColor), boxShadow(hoverShadow))

/** 按钮按下时切换外观，并向下移动一个细边界厚度。 */
export const activeStyle = styleRule(stateActive)
kitRoot.attach(activeStyle)

activeStyle.attach(
  backgroundColor(bgActiveColor),
  color(fgActiveColor),
  boxShadow(activeShadow),
  transform(translateY(thinBoundary)),
)

/** 键盘焦点轮廓不占布局空间，与按钮边缘留出间隔。 */
export const focusStyle = styleRule(focusVisible)
kitRoot.attach(focusStyle)

focusStyle.attach(
  outlineWidth(focusBoundary),
  outlineStyle('solid'),
  outlineColor(focusColor),
  outlineOffset(focusBoundary),
)

/** 裸底按钮退去背景与阴影，只在交互时提示位置。 */
export const bareStyle = styleRule('&[data-variant="bare"]')
kitRoot.attach(bareStyle)

bareStyle.attach(backgroundColor('transparent'), border(thinBoundary, 'solid', 'transparent'), boxShadow('none'))

/** 裸底按钮悬停时使用浅色覆盖层。 */
export const bareHoverStyle = styleRule(stateHover)
bareStyle.attach(bareHoverStyle)

bareHoverStyle.attach(backgroundColor(hoverOverlay), boxShadow('none'))

/** 裸底按钮按下时加深覆盖层。 */
export const bareActiveStyle = styleRule(stateActive)
bareStyle.attach(bareActiveStyle)

bareActiveStyle.attach(backgroundColor(activeOverlay), boxShadow('none'))

/** 实心按钮使用动作底色和抬升阴影。 */
export const solidStyle = styleRule('&[data-variant="solid"]')
kitRoot.attach(solidStyle)

solidStyle.attach(
  backgroundColor(actionColor),
  border(thinBoundary, 'solid', 'transparent'),
  boxShadow(raisedShadow),
  color(actionForegroundColor),
)

/** 实心按钮悬停时保持实心外观。 */
export const solidHoverStyle = styleRule(stateHover)
solidStyle.attach(solidHoverStyle)

solidHoverStyle.attach(backgroundColor(actionHoverColor), color(actionForegroundColor), boxShadow(raisedShadow))

/** 实心按钮按下时保持动作前景色和阴影。 */
export const solidActiveStyle = styleRule(stateActive)
solidStyle.attach(solidActiveStyle)

solidActiveStyle.attach(backgroundColor(actionActiveColor), color(actionForegroundColor), boxShadow(raisedShadow))

/** 强调按钮定义语气配色；外观变体不决定语气。 */
export const accentStyle = styleRule('&[data-tone="accent"]')
kitRoot.attach(accentStyle)

accentStyle.attach(
  declareVariable(toneColor, accentColor),
  declareVariable(toneSoftColor, accentSoftColor),
  declareVariable(toneForeground, accentForegroundColor),
  declareVariable(focusColor, accentFocusColor),
  declareVariable(edgeColor, accentSoftColor),
)

// 边缘、背景与文字消费当前作用域的语气值。
accentStyle.attach(border(thinBoundary, 'solid', edgeColor), backgroundColor(toneBackground), color(toneColor))

/** 强调按钮悬停时增加语气色占比。 */
export const accentHoverStyle = styleRule(stateHover)
accentStyle.attach(accentHoverStyle)

accentHoverStyle.attach(backgroundColor(toneHoverBackground), color(toneForeground))

/** 强调按钮按下时继续加深语气色。 */
export const accentActiveStyle = styleRule(stateActive)
accentStyle.attach(accentActiveStyle)

accentActiveStyle.attach(backgroundColor(toneActiveBackground), color(toneForeground))

/** 危险按钮定义语气配色；外观变体不决定语气。 */
export const dangerStyle = styleRule('&[data-tone="danger"]')
kitRoot.attach(dangerStyle)

dangerStyle.attach(
  declareVariable(toneColor, dangerColor),
  declareVariable(toneSoftColor, dangerSoftColor),
  declareVariable(toneForeground, dangerForegroundColor),
  declareVariable(focusColor, dangerLineColor),
  declareVariable(edgeColor, dangerSoftColor),
)

// 边缘、背景与文字消费当前作用域的语气值。
dangerStyle.attach(border(thinBoundary, 'solid', edgeColor), backgroundColor(toneBackground), color(toneColor))

/** 危险按钮悬停时增加语气色占比。 */
export const dangerHoverStyle = styleRule(stateHover)
dangerStyle.attach(dangerHoverStyle)

dangerHoverStyle.attach(backgroundColor(toneHoverBackground), color(toneForeground))

/** 危险按钮按下时继续加深语气色。 */
export const dangerActiveStyle = styleRule(stateActive)
dangerStyle.attach(dangerActiveStyle)

dangerActiveStyle.attach(backgroundColor(toneActiveBackground), color(toneForeground))

/** 实心且带语气时使用动作前景色；此条件比禁用分支更具体。 */
export const solidToneStyle = styleRule('&[data-variant="solid"][data-tone]')
kitRoot.attach(solidToneStyle)

solidToneStyle.attach(color(actionForegroundColor))

/** 小号按钮同步调整高度、内边距、内容间距与字号。 */
export const smallStyle = styleRule('&[data-size="small"]')
kitRoot.attach(smallStyle)

smallStyle.attach(
  declareVariable(minimumHeight, smallSize),
  declareVariable(horizontalPadding, mediumSpace),
  declareVariable(verticalPadding, smallSpace),
  declareVariable(contentGap, smallSpace),
  declareVariable(controlTextSize, normalTextSize),
)

/** 大号按钮同步调整高度、内边距、内容间距与字号。 */
export const largeStyle = styleRule('&[data-size="large"]')
kitRoot.attach(largeStyle)

largeStyle.attach(
  declareVariable(minimumHeight, largeSize),
  declareVariable(horizontalPadding, wideSpace),
  declareVariable(verticalPadding, normalSpace),
  declareVariable(contentGap, mediumSpace),
  declareVariable(controlTextSize, xlargeTextSize),
)

/** 超大号按钮同步调整高度、内边距、内容间距与字号。 */
export const xlargeStyle = styleRule('&[data-size="xlarge"]')
kitRoot.attach(xlargeStyle)

xlargeStyle.attach(
  declareVariable(minimumHeight, xlargeSize),
  declareVariable(horizontalPadding, widestSpace),
  declareVariable(verticalPadding, mediumSpace),
  declareVariable(contentGap, largeSpace),
  declareVariable(controlTextSize, headingTextSize),
)

/** 加载只提示忙碌，不阻止事件。 */
export const loadingStyle = styleRule('&[data-status~="loading"]')
kitRoot.attach(loadingStyle)

loadingStyle.attach(cursor('progress'))

/** 禁用兼顾原生属性与状态标记，淡化外观并移除阴影和位移。 */
export const disabledStyle = styleRule('&:disabled, &[data-status~="disabled"]')
kitRoot.attach(disabledStyle)

disabledStyle.attach(
  backgroundColor(baseSurfaceColor),
  color(foregroundColor),
  boxShadow('none'),
  cursor('not-allowed'),
  opacity(disabledOpacity),
  transform('none'),
)

/** 浏览器宿主须先提供 style#css-root；服务器端只保留定义。 */
export function registerButtonStyle(): void {
  if (typeof document === 'undefined') return
  cssRoot.activate(kitRoot)
}
