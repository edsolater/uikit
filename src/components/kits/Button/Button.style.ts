/**
 * 按钮的完整样式定义。
 *
 * Token 在按钮地址定义基础与状态，rules 只消费属性和效果。
 * 外观、语气与交互分别匹配，不在后续规则中重新赋值 Token。
 */
import {
  rules,
  createNewTokenGenerator,
  multiply,
  oklch,
  colorMix,
  innerText,
  contentLayout,
  size,
  boundary,
  color,
  elevation,
  clickable,
  brandColor,
  badColor,
  contentColor,
  surfaceColor,
  paperColor,
  interactiveColorStates,
  baseSpace,
  textSize,
  controlSize,
  fontWeight,
  boundaryWidth,
  baseOpacity,
  baseShadow,
  baseShadowSmall,
  stateConditionRegistry,
} from '@/style-system'

const button = ['@layer uikit', '.Button']
const buttonToken = createNewTokenGenerator({
  prefixName: 'button',
  address: button,
})

/** 语气与交互共同定义按钮的颜色来源，同属性由 CSS 层叠决定。 */
export const buttonColorSource = buttonToken(brandColor, {
  name: 'button-color-source',
  state: [interactiveColorStates({ chromaResponse: 1 }), { danger: badColor }],
})

/** 混合当前基色与主题表面，只产生计算表达式。 */
function mixButtonSurface(strength: number, alpha: number) {
  const buttonColorSourceWithAlpha = oklch(buttonColorSource, {
    alpha: (current) => multiply(current, alpha),
  })
  return colorMix([buttonColorSourceWithAlpha, strength], surfaceColor)
}

/** 外观独立选择背景；交互继续由基色提供。 */
export const buttonSurfaceColor = buttonToken(mixButtonSurface(0.18, 0.14), {
  name: 'button-surface-color',
  state: { plain: 'transparent', filled: mixButtonSurface(1, 1) },
})

/** 普通内容沿用主题；语气内容读当前基色，填充外观保留纸色对比。 */
export const buttonContentColor = buttonToken(contentColor, {
  name: 'button-content-color',
  state: { toned: buttonColorSource, filled: paperColor },
})

const buttonBoundaryColor = oklch(buttonColorSource, {
  alpha: (current) => multiply(current, 0.44),
})

/** 几何状态在组件地址计算，保留对公共尺寸基准的引用。 */
const buttonSpace = buttonToken(baseSpace)
const buttonPaddingBlock = buttonToken(baseSpace, {
  name: 'button-padding-block',
  state: {
    small: (base) => multiply(base, 1 / 2),
    xlarge: (base) => multiply(base, 3 / 2),
  },
})
const buttonPaddingInline = buttonToken(multiply(baseSpace, 3), {
  state: {
    small: (base) => multiply(base, 1 / 2),
    large: (base) => multiply(base, 4 / 3),
    xlarge: (base) => multiply(base, 2),
  },
})
const buttonTextSize = buttonToken(textSize)
const buttonSize = buttonToken(controlSize)

/** 强调程度决定基础透明度。 */
const buttonOpacitySource = buttonToken(multiply(baseOpacity, 0.9), {
  state: { soft: multiply(baseOpacity, 0.7), strong: baseOpacity },
})

/** 禁用比例继续读取当前强调后的透明度。 */
const buttonOpacity = buttonToken(buttonOpacitySource, {
  state: { disabled: (base) => multiply(base, 0.48 / 0.9) },
})

/** 按钮外观选择基础阴影材料。 */
const buttonShadowSource = buttonToken(baseShadowSmall, {
  state: { plain: 'none', filled: baseShadow },
})

/** 按钮决定交互与禁用时采用哪份阴影。 */
const buttonShadow = buttonToken(buttonShadowSource, {
  state: { hover: baseShadow, active: 'none', disabled: 'none' },
})

rules(button, [
  innerText({
    font: 'inherit',
    fontSize: buttonTextSize,
    emphasis: multiply(fontWeight, 7 / 4),
    leading: 1,
  }),
  contentLayout({
    mode: 'center',
    alignSelf: 'center',
    gap: buttonSpace,
    padding: [buttonPaddingBlock, buttonPaddingInline],
  }),
  size({ minHeight: buttonSize }),
  boundary({
    border: [boundaryWidth, 'solid', 'transparent'],
    radius: '999px',
    cornerShape: 'squircle',
  }),
  color({ background: buttonSurfaceColor, content: buttonContentColor }),
  elevation(buttonShadow),
  clickable({
    address: button,
    opacity: buttonOpacity,
    focusColor: buttonBoundaryColor,
  }),
])

// 普通属性的条件差异直接交给 rules，不重声明任何 Token。
rules([...button, stateConditionRegistry.outlined], {
  'border-color': buttonBoundaryColor,
})
rules([...button, stateConditionRegistry.loading], { cursor: 'progress' })
rules([...button, stateConditionRegistry.disabled], { cursor: 'not-allowed' })
