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
  contentLayout,
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
  name: 'button-color-source',
  state: [interactiveColorStates({ chromaResponse: 1 }), { danger: badColor }],
})

function mixButtonSurface({
  strength,
  alpha,
}: {
  strength: number
  alpha: number
}) {
  const buttonColorSourceWithAlpha = oklch(buttonColorSource, {
    alpha: (current) => multiply(current, alpha),
  })
  return colorMix([buttonColorSourceWithAlpha, strength], surfaceColor)
}

export const buttonSurfaceColor = buttonToken(
  mixButtonSurface({ strength: 0.18, alpha: 0.14 }),
  {
    name: 'button-surface-color',
    state: {
      plain: 'transparent',
      filled: mixButtonSurface({ strength: 1, alpha: 1 }),
    },
  },
)

export const buttonContentColor = buttonToken(contentColor, {
  name: 'button-content-color',
  state: { toned: buttonColorSource, filled: paperColor },
})

export const buttonBoundaryColor = buttonToken(
  oklch(buttonColorSource, {
    alpha: (current) => multiply(current, 0.44),
  }),
  { name: 'button-boundary-color' },
)
export const buttonBorderColor = buttonToken('transparent', {
  name: 'button-border-color',
  state: { outlined: buttonBoundaryColor },
})

export const buttonTextSize = buttonToken(textSize, {
  name: 'button-text-size',
})
export const buttonFontWeight = buttonToken(multiply(fontWeight, 7 / 4), {
  name: 'button-font-weight',
})
export const buttonMinHeight = buttonToken(controlSize, {
  name: 'button-min-height',
})
export const buttonGap = buttonToken(baseSpace, { name: 'button-gap' })
export const buttonPaddingBlock = buttonToken(baseSpace, {
  name: 'button-padding-block',
  state: {
    small: (base) => multiply(base, 1 / 2),
    xlarge: (base) => multiply(base, 3 / 2),
  },
})
export const buttonPaddingInline = buttonToken(multiply(baseSpace, 3), {
  name: 'button-padding-inline',
  state: {
    small: (base) => multiply(base, 1 / 2),
    large: (base) => multiply(base, 4 / 3),
    xlarge: (base) => multiply(base, 2),
  },
})

export const buttonBoxShadow = buttonToken(baseShadowSmall, {
  name: 'button-shadow',
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
  name: 'button-opacity-source',
  state: { soft: multiply(baseOpacity, 0.7), strong: baseOpacity },
})
export const buttonOpacity = buttonToken(buttonOpacitySource, {
  name: 'button-opacity',
  state: { disabled: (base) => multiply(base, 0.48 / 0.9) },
})

rules(button, [
  {
    'font': 'inherit',
    'font-size': buttonTextSize,
    'font-weight': buttonFontWeight,
    'line-height': 1,
    'min-height': buttonMinHeight,
    'border-width': buttonBorderWidth,
    'border-style': 'solid',
    'border-color': buttonBorderColor,
    'border-radius': '999px',
    'corner-shape': 'squircle',
    'background-color': buttonSurfaceColor,
    'color': buttonContentColor,
    'box-shadow': buttonBoxShadow,
  },
  contentLayout({
    mode: 'center',
    alignSelf: 'center',
    gap: buttonGap,
    padding: [buttonPaddingBlock, buttonPaddingInline],
  }),
  clickable({
    cursor: buttonToken('pointer', {
      state: { loading: 'progress', disabled: 'not-allowed' },
    }),
    opacity: buttonOpacity,
    focusColor: buttonBoundaryColor,
  }),
])
