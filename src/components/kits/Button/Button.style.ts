/** Button 选择共享材料，在自身规则中定义变量取值和交互。 */
import { styleRule, cssRoot, type Value } from '../../../style-system/core'
import { properties, variables, values, selectors } from '../../../style-system/tokens'

type ButtonSize = 'small' | 'large' | 'xlarge'

/** 状态切换时平滑过渡颜色、阴影、透明度与位移，不让尺寸跟着补间。 */
const transitionProperties = [
  properties.backgroundColorKey,
  properties.borderColorKey,
  properties.boxShadowKey,
  properties.colorKey,
  properties.opacityKey,
  properties.transformKey,
]

/** 可点击提示与状态反馈：悬停换色、按下下移，键盘焦点显示轮廓。 */
const interaction = [
  // 鼠标提示可点击，拖动经过文字时不选中文本。
  properties.cursor('pointer'),
  properties.userSelect('none'),

  // 共用时长与缓动；减少动效偏好由共享动效变量处理。
  properties.transition(
    transitionProperties.map((property) =>
      properties.transitionValue(property, variables.motion.fast, variables.motion.standard),
    ),
  ),

  // 原生禁用控件排除在悬停反馈之外。
  selectors.enabledHover(
    properties.backgroundColor(variables.bgColor.hover),
    properties.color(variables.fgColor.hover),
    properties.boxShadow(variables.shadow.hover),
  ),

  // 按下时切换到按压外观，并向下移动一个边界厚度。
  selectors.enabledActive(
    properties.backgroundColor(variables.bgColor.active),
    properties.color(variables.fgColor.active),
    properties.boxShadow(variables.shadow.active),
    properties.transform(properties.translateY(variables.boundary.thin)),
  ),

  // 焦点轮廓不占布局空间，与边缘留出间隔。
  selectors.focusVisible(
    properties.outlineWidth(variables.boundary.focus),
    properties.outlineStyle('solid'),
    properties.outlineColor(variables.focusColor),
    properties.outlineOffset(variables.boundary.focus),
  ),
]

/** 低权重动作退去背景与阴影，只在交互时提示位置。 */
const bareAppearance = [
  properties.backgroundColor('transparent'),
  properties.border(variables.boundary.thin, 'solid', 'transparent'),
  properties.boxShadow('none'),

  selectors.enabledHover(properties.backgroundColor(values.overlays.hover), properties.boxShadow('none')),

  selectors.enabledActive(properties.backgroundColor(values.overlays.active), properties.boxShadow('none')),
]

/** 实心底色配合抬升阴影，悬停与按下保持实心外观和对应前景色。 */
const solidAppearance = [
  properties.backgroundColor(variables.actionColor),
  properties.border(variables.boundary.thin, 'solid', 'transparent'),
  properties.boxShadow(variables.shadows.raised),
  properties.color(variables.colors.actionFg),

  selectors.enabledHover(
    properties.backgroundColor(variables.actionColor.hover),
    properties.color(variables.colors.actionFg),
    properties.boxShadow(variables.shadows.raised),
  ),

  selectors.enabledActive(
    properties.backgroundColor(variables.actionColor.active),
    properties.color(variables.colors.actionFg),
    properties.boxShadow(variables.shadows.raised),
  ),
]

/**
 * 语气色覆盖基础外观，悬停与按下继续使用对应语气。
 * @example
 * toneAppearance(variables.colors.bad, variables.colors.badSoft, variables.colors.badFg, variables.colors.badLine)
 */
function toneAppearance(main: Value, soft: Value, foreground: Value, focus: Value) {
  return [
    variables.toneColor(main),
    variables.toneSoftColor(soft),
    variables.toneForeground(foreground),
    variables.focusColor(focus),
    variables.borderColor(soft),

    properties.border(variables.boundary.thin, 'solid', variables.borderColor),
    properties.backgroundColor(variables.toneBackground),
    properties.color(variables.toneColor),

    selectors.enabledHover(
      properties.backgroundColor(variables.toneBackground.hover),
      properties.color(variables.toneForeground),
    ),

    selectors.enabledActive(
      properties.backgroundColor(variables.toneBackground.active),
      properties.color(variables.toneForeground),
    ),
  ]
}

/** 小、大、超大档位的成组取值；普通尺寸沿用公共变量的兜底值。 */
const sizes = {
  small: {
    height: variables.size.small,
    x: variables.space.medium,
    y: variables.space.small,
    gap: variables.space.small,
    font: variables.textSize.normal,
  },

  large: {
    height: variables.size.large,
    x: variables.space.wide,
    y: variables.space.normal,
    gap: variables.space.medium,
    font: variables.textSize.xlarge,
  },

  xlarge: {
    height: variables.size.xlarge,
    x: variables.space.widest,
    y: variables.space.medium,
    gap: variables.space.large,
    font: variables.textSize.heading,
  },
}

/** 尺寸档位同步调整控件高度、内边距、内容间距与字号。 */
function sizeLayout(name: ButtonSize) {
  const selected = sizes[name]
  return [
    variables.minHeight(selected.height),
    variables.paddingX(selected.x),
    variables.paddingY(selected.y),
    variables.gap(selected.gap),
    variables.fontSize(selected.font),
  ]
}

/** 淡化外观，移除阴影和位移，并显示不可用光标；不负责阻止事件。 */
const unavailable = [
  properties.backgroundColor(variables.colors.surface),
  properties.color(variables.colors.fg),
  properties.boxShadow('none'),
  properties.cursor('not-allowed'),
  properties.opacity(values.opacities.disabled),
  properties.transform('none'),
]

// 外观与语气分别选择：裸底/实心不决定强调色或危险色。
const bare = styleRule('&[data-variant="bare"]')
const solid = styleRule('&[data-variant="solid"]')
const accent = styleRule('&[data-tone="accent"]')
const danger = styleRule('&[data-tone="danger"]')

// 尺寸分支只选择档位，具体尺寸关系集中在 sizes 中。
const small = styleRule('&[data-size="small"]')
const large = styleRule('&[data-size="large"]')
const xlarge = styleRule('&[data-size="xlarge"]')

// 加载和禁用状态可同时存在；禁用兼顾原生属性与状态标记。
const loading = styleRule('&[data-status~="loading"]')
const disabled = styleRule('&:disabled, &[data-status~="disabled"]')

/**
 * 胶囊形按钮：基础外观之上叠加交互、变体、语气和尺寸。
 * 实心与语气组合的前景色优先级高于禁用分支；排列顺序不改变这一关系。
 */
export const buttonRules = styleRule('.Button')(
  // 本组件选择胶囊圆角与粗字重，其他组件仍可独立定义同一组变量。
  variables.radius(values.radii.pill),
  variables.fontWeight(values.fontWeights.bold),

  // 内容居中；高度、间隔和内边距由公共变量控制。
  properties.inlineCenter,
  properties.gap(variables.gap),
  properties.minHeight(variables.minHeight),
  properties.padding(variables.paddingY, variables.paddingX),

  // 细实线边缘搭配可覆盖的圆角。
  properties.border(variables.boundary.thin, 'solid', variables.borderColor),
  properties.borderRadius(variables.radius),

  // 继承字体后，应用组件字号、字重与行高。
  properties.font('inherit'),
  properties.fontSize(variables.fontSize),
  properties.fontWeight(variables.fontWeight),
  properties.lineHeight(variables.lineHeight),

  // 默认底色、前景色与阴影，随后接入各交互状态。
  properties.backgroundColor(variables.bgColor),
  properties.color(variables.fgColor),
  properties.boxShadow(variables.shadow),
  interaction,

  // 裸底和实心外观覆盖默认外观，语气分支再确定强调或危险配色。
  bare(bareAppearance),
  solid(solidAppearance),
  accent(
    toneAppearance(
      variables.colors.accent,
      variables.colors.accentSoft,
      variables.colors.accentFg,
      variables.colors.accentFocus,
    ),
  ),
  danger(
    toneAppearance(variables.colors.bad, variables.colors.badSoft, variables.colors.badFg, variables.colors.badLine),
  ),

  // 实心且带语气时采用动作前景色；该选择器比禁用分支更具体。
  styleRule('&[data-variant="solid"][data-tone]')(properties.color(variables.colors.actionFg)),

  // 高度、内边距、内容间距和字号成组切换。
  small(sizeLayout('small')),
  large(sizeLayout('large')),
  xlarge(sizeLayout('xlarge')),

  // 加载只提示忙碌；禁用分支随后叠加，仍受前述选择器优先级限制。
  loading(properties.cursor('progress')),
  disabled(unavailable),
)

/** 浏览器宿主须先提供 style#css-root；服务器端只保留定义。 */
export function registerButtonStyle(): void {
  if (typeof document === 'undefined') return
  cssRoot.activate(buttonRules)
}
