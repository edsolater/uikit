/**
 * 按钮的完整样式定义。
 *
 * Token 在按钮地址定义基础与状态，rules 只消费属性和效果。
 *
 * 将外观、语气与交互保持为独立状态，避免后续规则重复改写基础定义。
 */
import { componentName } from './Button.prop'
import {
  rules,
  createNewTokenGenerator,
  multiply,
  colorMix,
  contentText,
  contentLayout,
  size,
  boundary,
  color,
  paint,
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
  baseBorderWidth,
  baseOpacity,
  baseShadow,
  baseShadowSmall,
} from '@/style-system'

import type { StyleConfig } from '../../tools/styleConfig'

const buttonAddress = ['@layer uikit', `.${componentName}`]
const buttonToken = createNewTokenGenerator({
  prefixName: 'button',
  address: buttonAddress,
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
  color({
    base: buttonColorSource,
    alpha: (current) => multiply(current, 0.44),
  }),
)
export const buttonBorderColor = buttonToken('transparent', {
  state: { outlined: buttonBoundaryColor },
})
export const buttonBorderWidth = buttonToken(baseBorderWidth, {
  state: { plain: 0 },
})
export const buttonRadius = buttonToken('999px', { state: { plain: 0 } })

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
export const buttonPaddingInline = buttonToken(multiply(baseSpace, 3))
export const buttonBoxShadow = buttonToken(baseShadowSmall, {
  state: {
    filled: baseShadow,
    hover: baseShadow,
    active: 'none',
    disabled: 'none',
    plain: 'none',
  },
})
// 强调选择后、禁用缩放前的独立透明度阶段，供外部引用与最终计算。
export const buttonOpacitySource = buttonToken(multiply(baseOpacity, 0.9), {
  state: { soft: multiply(baseOpacity, 0.7), strong: baseOpacity },
})
export const buttonOpacity = buttonToken(buttonOpacitySource, {
  state: { disabled: (base) => multiply(base, 0.48 / 0.9) },
})

rules(buttonAddress, [
  paint({ background: buttonSurfaceColor, content: buttonContentColor }),
  boundary({
    border: [buttonBorderWidth, 'solid', buttonBorderColor],
    radius: buttonRadius,
    cornerShape: 'squircle',
  }),
  size({ minHeight: buttonMinHeight }),

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
  elevation(buttonBoxShadow),
  clickable({
    cursor: buttonToken('pointer', {
      state: { loading: 'progress', disabled: 'not-allowed' },
    }),
    opacity: buttonOpacity,
    focusColor: buttonBoundaryColor,
  }),
])

/** 按钮应用可配置的已有间距控制点。 */
export interface ButtonStyleConfig {
  /** 图标与文字等子内容之间的间距。 */
  gap?: string
}

/** 按钮的可选样式输入只解释已有间距控制点。 */
export const buttonStyleConfig = {
  /**
   * 设置当前按钮内图标与文字等内容之间的距离。
   */
  gap: (value) => buttonGap.set(value),
} satisfies StyleConfig<ButtonStyleConfig>
