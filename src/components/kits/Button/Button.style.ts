/**
 * 按钮的完整样式定义。
 *
 * Token 在按钮地址定义基础与状态，rules 只消费属性和效果。
 * 外观、语气和交互交集由组件明确选择，不在后续规则中重新赋值 Token。
 */
import {
  rules,
  token,
  add,
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
  globalSurfaceColor,
  paperColor,
  interactiveColorStates,
  space,
  textSize,
  controlSize,
  fontWeight,
  boundaryWidth,
  opacity,
  shadowFor,
  spaceGap,
  spacePaddingBlock,
  spacePaddingInline,
  whenHover,
  whenActive,
  whenDisabled,
  whenEnabled,
  whenLoading,
  whenFilled,
  whenOutlined,
  whenPlain,
  whenToned,
  whenDanger,
  whenSoft,
  whenStrong,
} from '@/style-system'

const button = ['@layer uikit', '.Button']

/** 选择材料并定义交互；危险语气的交集直接使用危险材料计算。 */
export const buttonColor = token(
  {
    ...interactiveColorStates({ base: brandColor, chromaResponse: 1 }),
    [whenDanger.header]: badColor,
    [whenDanger.header + whenHover.header.slice(1)]: oklch(badColor, {
      lightness: (current) => add(current, -0.04),
      chroma: (current) => add(current, 0.01),
    }),
    [whenDanger.header + whenActive.header.slice(1)]: oklch(badColor, {
      lightness: (current) => add(current, -0.08),
      chroma: (current) => add(current, -0.01),
    }),
  },
  { name: 'button-color', address: button },
)

/** 混合当前基色与主题表面，只产生计算表达式。 */
function mixButtonSurface(strength: number, alpha: number, lightness = 0) {
  return colorMix(
    [
      oklch(buttonColor, { alpha: (current) => multiply(current, alpha) }),
      strength,
    ],
    oklch(globalSurfaceColor, {
      lightness: (current) => add(current, lightness),
    }),
  )
}

/** 背景的三种外观及交互全部在此定义，未禁用时才进入交互状态。 */
export const buttonSurfaceColor = token(
  {
    default: mixButtonSurface(0.18, 0.14),
    [whenHover.header]: () => mixButtonSurface(0.28, 0.14, -0.04),
    [whenActive.header]: () => mixButtonSurface(0.38, 0.14, -0.08),
    [whenPlain.header]: 'transparent',
    [whenPlain.header + whenHover.header.slice(1)]: oklch(buttonColor, {
      alpha: (current) => multiply(current, 0.14 * 0.08),
    }),
    [whenPlain.header + whenActive.header.slice(1)]: oklch(buttonColor, {
      alpha: (current) => multiply(current, 0.14 * 0.14),
    }),
    [whenFilled.header]: mixButtonSurface(1, 1),
    [whenFilled.header + whenHover.header.slice(1)]: mixButtonSurface(
      0.95,
      1,
      -0.04,
    ),
    [whenFilled.header + whenActive.header.slice(1)]: mixButtonSurface(
      0.9,
      1,
      -0.08,
    ),
  },
  { name: 'button-surface-color', address: button },
)

/** 普通内容沿用主题；语气内容读当前基色，填充外观保留纸色对比。 */
export const buttonContentColor = token(contentColor, {
  name: 'button-content-color',
  address: button,
  state: { [whenToned.header]: buttonColor, [whenFilled.header]: paperColor },
})

const boundaryColor = oklch(buttonColor, {
  alpha: (current) => multiply(current, 0.44),
})

/** 几何状态在组件地址计算，保留对公共尺寸基准的引用。 */
const buttonSpacing = token(space, {
  address: button,
  state: space.state,
})
const buttonTextSize = token(textSize, {
  address: button,
  state: textSize.state,
})
const buttonSize = token(controlSize, {
  address: button,
  state: controlSize.state,
})

/** 存在感与禁用共同作用于整颗按钮。 */
const buttonOpacity = token(multiply(opacity, 0.9), {
  address: button,
  state: {
    [whenDisabled.header]: (base) => multiply(base, 0.48 / 0.9),
    [whenSoft.header + whenEnabled.header.slice(1)]: (base) =>
      multiply(base, 0.7 / 0.9),
    [whenStrong.header + whenEnabled.header.slice(1)]: (base) =>
      multiply(base, 1 / 0.9),
  },
})

const controlShadow = shadowFor('control')
const filledShadow = shadowFor('filledControl')
/** 阴影与外观、交互和禁用的组合属于同一份定义。 */
const buttonShadow = token(controlShadow.default, {
  address: button,
  state: {
    ...controlShadow.state,
    [whenPlain.header]: 'none',
    [whenFilled.header]: filledShadow.default,
    [whenFilled.header + whenHover.header.slice(1)]: filledShadow.state!.hover,
    [whenFilled.header + whenActive.header.slice(1)]: 'none',
    [whenFilled.header + whenDisabled.header.slice(1)]: 'none',
  },
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
    gap: spaceGap(buttonSpacing),
    padding: [
      spacePaddingBlock(buttonSpacing),
      spacePaddingInline(buttonSpacing),
    ],
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
    focusColor: boundaryColor,
  }),
])

// 普通属性的条件差异直接交给 rules，不重声明任何 Token。
rules([...button, whenOutlined], {
  'border-color': boundaryColor,
})
rules([...button, whenLoading], { cursor: 'progress' })
rules([...button, whenLoading, whenDisabled], {
  cursor: 'not-allowed',
})
