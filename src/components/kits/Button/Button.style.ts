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
} from '@/style-system'

const button = ['@layer uikit', '.Button']
const buttonToken = createNewTokenGenerator({
  prefixName: 'button',
  address: button,
})

export const buttonColorSource = buttonToken(brandColor, {
  name: 'button-color-source',
  state: [interactiveColorStates({ chromaResponse: 1 }), { danger: badColor }],
})

function mixButtonSurface(strength: number, alpha: number) {
  const buttonColorSourceWithAlpha = oklch(buttonColorSource, {
    alpha: (current) => multiply(current, alpha),
  })
  return colorMix([buttonColorSourceWithAlpha, strength], surfaceColor)
}

export const buttonSurfaceColor = buttonToken(mixButtonSurface(0.18, 0.14), {
  name: 'button-surface-color',
  state: { plain: 'transparent', filled: mixButtonSurface(1, 1) },
})

export const buttonContentColor = buttonToken(contentColor, {
  name: 'button-content-color',
  state: { toned: buttonColorSource, filled: paperColor },
})

const buttonBoundaryColor = oklch(buttonColorSource, {
  alpha: (current) => multiply(current, 0.44),
})
const buttonBorderColor = buttonToken('transparent', {
  state: { outlined: buttonBoundaryColor },
})

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

const buttonOpacitySource = buttonToken(multiply(baseOpacity, 0.9), {
  state: { soft: multiply(baseOpacity, 0.7), strong: baseOpacity },
})

const buttonOpacity = buttonToken(buttonOpacitySource, {
  state: { disabled: (base) => multiply(base, 0.48 / 0.9) },
})

const buttonShadowSource = buttonToken(baseShadowSmall, {
  state: { plain: 'none', filled: baseShadow },
})

const buttonShadow = buttonToken(buttonShadowSource, {
  state: { hover: baseShadow, active: 'none', disabled: 'none' },
})
const buttonCursor = buttonToken('pointer', {
  state: { loading: 'progress', disabled: 'not-allowed' },
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
    border: [boundaryWidth, 'solid', buttonBorderColor],
    radius: '999px',
    cornerShape: 'squircle',
  }),
  color({ background: buttonSurfaceColor, content: buttonContentColor }),
  elevation(buttonShadow),
  clickable({
    address: button,
    cursor: buttonCursor,
    opacity: buttonOpacity,
    focusColor: buttonBoundaryColor,
  }),
])
