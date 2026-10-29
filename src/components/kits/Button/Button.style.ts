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
  contentText,
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
  buttonBorderWidth,
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
  state: [interactiveColorStates({ chromaResponse: 1 }), { danger: badColor }],
})

export const buttonSurfaceColor = buttonToken(
  colorMix(
    {
      color: {
        base: buttonColorSource,
        alpha: (current) => multiply(current, 0.14),
      },
      weight: 0.18,
    },
    surfaceColor,
  ),
  {
    state: {
      plain: 'transparent',
      filled: buttonColorSource,
    },
  },
)

export const buttonContentColor = buttonToken(contentColor, {
  state: { toned: buttonColorSource, filled: paperColor },
})

export const buttonBoundaryColor = buttonToken(
  oklch(buttonColorSource, {
    alpha: (current) => multiply(current, 0.44),
  }),
)
export const buttonBorderColor = buttonToken('transparent', {
  state: { outlined: buttonBoundaryColor },
})

export const buttonTextSize = buttonToken(textSize)
export const buttonFontWeight = buttonToken(multiply(fontWeight, 7 / 4))
export const buttonMinHeight = buttonToken(controlSize)
export const buttonGap = buttonToken(baseSpace)
export const buttonPaddingBlock = buttonToken(baseSpace, {
  state: {
    small: (base) => multiply(base, 1 / 2),
    xlarge: (base) => multiply(base, 3 / 2),
  },
})
export const buttonPaddingInline = buttonToken(multiply(baseSpace, 3), {
  state: {
    small: (base) => multiply(base, 1 / 2),
    large: (base) => multiply(base, 4 / 3),
    xlarge: (base) => multiply(base, 2),
  },
})

export const buttonBoxShadow = buttonToken(baseShadowSmall, {
  state: {
    plain: 'none',
    filled: baseShadow,
    hover: baseShadow,
    active: 'none',
    disabled: 'none',
  },
})
// 强调状态下、禁用缩放前的完整透明度，供读取并作为最终透明度的基准。
export const buttonOpacitySource = buttonToken(multiply(baseOpacity, 0.9), {
  state: { soft: multiply(baseOpacity, 0.7), strong: baseOpacity },
})
export const buttonOpacity = buttonToken(buttonOpacitySource, {
  state: { disabled: (base) => multiply(base, 0.48 / 0.9) },
})

rules(button, [
  contentText({
    font: 'inherit',
    fontSize: buttonTextSize,
    emphasis: buttonFontWeight,
    leading: 1,
  }),
  contentLayout({
    mode: 'center',
    alignSelf: 'center',
    gap: buttonGap,
    padding: [buttonPaddingBlock, buttonPaddingInline],
  }),
  size({ minHeight: buttonMinHeight }),
  boundary({
    border: [buttonBorderWidth, 'solid', buttonBorderColor],
    radius: '999px',
    cornerShape: 'squircle',
  }),
  color({ background: buttonSurfaceColor, content: buttonContentColor }),
  elevation(buttonBoxShadow),
  clickable({
    cursor: buttonToken('pointer', {
      state: { loading: 'progress', disabled: 'not-allowed' },
    }),
    opacity: buttonOpacity,
    focusColor: buttonBoundaryColor,
  }),
])
