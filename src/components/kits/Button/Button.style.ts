/** 按钮的样式效果与生效条件。

组合颜色、尺寸和布局，声明组件控制变量及各分类贡献。

组件自身的选择条件留在样式定义端，可复用效果交给 Style System。
*/
import {
  rules,
  add,
  token,
  innerText,
  contentLayout,
  size,
  boundary,
  color,
  elevation,
  clickable,
  $cursor,
  colorMix,
  badColor,
  contentColor,
  globalSurfaceColor,
  whenDisabled,
  space,
  boundaryWidth,
  controlSize,
  fontWeight,
  textSize,
  shadowFor,
  spaceGap,
  spacePaddingBlock,
  spacePaddingInline,
  paperColor,
  oklch,
  opacity,
  multiply,
  brandColor,
  interactiveColorStates,
  whenHover,
  whenActive,
} from '@/style-system'

const button = ['@layer uikit', `.Button`]
const buttonSpacing = token(space, {
  name: 'button-space',
  address: button,
  state: space.state,
})
const buttonTextSize = token(textSize, {
  name: 'button-text-size',
  address: button,
  state: textSize.state,
})
const buttonSize = token(controlSize, {
  name: 'button-size',
  address: button,
  state: controlSize.state,
})

/** 组件的局部颜色输入；状态在按钮地址计算，分类选择明确材料。 */
export const buttonColor = token(
  interactiveColorStates({ base: brandColor, chromaResponse: 1 }),
  {
    name: 'button-color',
    address: button,
  },
)

/** 边界与焦点直接使用当前基色的线条表达式，不另设控制点。 */
const boundaryColor = oklch(buttonColor, {
  alpha: (current) => multiply(current, 0.44),
})

/** 混合按钮基色与主题表面；仅返回计算表达式，不创建中间控制变量。 */
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

/** Button 大面积色；外观分类直接替换此处的最终配方。 */
export const buttonSurfaceColor = token(mixButtonSurface(0.18, 0.14), {
  name: 'button-surface-color',
  address: button,
})

/** Button 内容色（文字、图标、图像）。 */
export const buttonContentColor = token(contentColor, {
  name: 'button-content-color',
  address: button,
})

/** 默认存在感及强调/禁用都相对于同一输入；组件保留原来的四种比例。 */
const buttonOpacity = token(multiply(opacity, 0.9), {
  name: 'button-opacity',
  address: button,
  state: {
    'disabled': (base) => multiply(base, 0.48 / 0.9),
    '&[data-emphasis="soft"]:not(:disabled, [data-status~="disabled"])': (
      base,
    ) => multiply(base, 0.7 / 0.9),
    '&[data-emphasis="strong"]:not(:disabled, [data-status~="disabled"])': (
      base,
    ) => multiply(base, 1 / 0.9),
  },
})

const controlShadow = shadowFor('control')
const buttonShadow = token(controlShadow.default, {
  name: 'button-shadow',
  address: button,
  state: controlShadow.state,
})

// 定义button的样式架构
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

rules(
  [...button, whenHover],
  [[buttonSurfaceColor, mixButtonSurface(0.28, 0.14, -0.04)]],
)
rules(
  [...button, whenActive],
  [[buttonSurfaceColor, mixButtonSurface(0.38, 0.14, -0.08)]],
)

// tone 动作语气

// tone 只选择材料；声量与状态沿用各自的独立效果。
rules([...button, '&[data-tone]'], [[buttonContentColor, buttonColor]])
rules([...button, '&[data-tone="danger"]'], [[buttonColor, badColor]])

// =============================================================================
// appearance 外观形式
// =============================================================================

// outlined 保留浅底，并用当前语气的线色形成可见轮廓。
rules(
  [...button, '&[data-appearance="outlined"]'],
  boundary({ border: [boundaryWidth, 'solid', boundaryColor] }),
)

// plain 保留透明常态与无边界，悬停和按下只增加轻量语气反馈。
const plainButton = [...button, '&[data-appearance="plain"]']
rules(plainButton, [[buttonSurfaceColor, 'transparent'], elevation('none')])
rules(
  [...plainButton, whenHover],
  [
    [
      buttonSurfaceColor,
      oklch(buttonColor, {
        alpha: (current) => multiply(current, 0.14 * 0.08),
      }),
    ],
  ],
)
rules(
  [...plainButton, whenActive],
  [
    [
      buttonSurfaceColor,
      oklch(buttonColor, {
        alpha: (current) => multiply(current, 0.14 * 0.14),
      }),
    ],
  ],
)

// filled 使用语气实底；交互时少量露出画布，避免混色抵消交互色的明度变化。
const filledControlShadow = shadowFor('filledControl')
const shadowFilled = token(filledControlShadow.default, {
  name: 'button-shadow-filled',
  address: [...button, '&[data-appearance="filled"]'],
  state: filledControlShadow.state,
})
const filledButton = [...button, '&[data-appearance="filled"]']
rules(filledButton, [
  [buttonSurfaceColor, mixButtonSurface(1, 1)],
  [buttonContentColor, paperColor],
  elevation(shadowFilled),
])
rules(
  [...filledButton, whenHover],
  [[buttonSurfaceColor, mixButtonSurface(0.95, 1, -0.04)]],
)
rules(
  [...filledButton, whenActive],
  [[buttonSurfaceColor, mixButtonSurface(0.9, 1, -0.08)]],
)

// =============================================================================
// status 外部状态
// =============================================================================

rules([...button, '&[data-status~="loading"]'], [[$cursor, 'progress']])
rules(
  [...button, '&[data-status~="loading"]', whenDisabled],
  [[$cursor, 'not-allowed']],
)
