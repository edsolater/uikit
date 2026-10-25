/** 按钮的样式效果与生效条件。

组合颜色、尺寸和布局，声明组件控制变量及各分类贡献。

组件自身的选择条件留在样式定义端，可复用效果交给 Style System。
*/
import {
  declare,
  modify,
  rules,
  add,
  variableFrom,
  innerText,
  contentLayout,
  size,
  boundary,
  color,
  elevation,
  clickable,
  $cursor,
  colorMix,
  interactiveColor,
  controlColor,
  interactiveSurfaceColor,
  surfaceStrength,
  badColor,
  globalSurfaceColor,
  globalContentColor,
  whenDisabled,
  space,
  boundaryWidth,
  controlSize,
  fontWeight,
  textSize,
  shadow,
  opacity,
  multiply,
} from '@/style-system'

const button = ['@layer uikit', `.Button`]
const buttonSpacing = variableFrom(space, space, { name: 'button-space', address: button })
const buttonTextSize = variableFrom(textSize, textSize, { name: 'button-text-size', address: button })
const buttonSize = variableFrom(controlSize, controlSize, { name: 'button-size', address: button })

/** 组件的局部颜色输入；变体保留真实引用，分类只需选择一次材料。 */
export const buttonColorInput = variableFrom(interactiveColor, { name: 'button-color-input', address: button })
/** Button 的颜色定义；使用处按表面、内容、边界及实底内容选择变体。 */
export const buttonColor = variableFrom(controlColor, buttonColorInput, { name: 'button-color', address: button })

/** 混色的动作色来源，默认使用局部语气的柔和成员。 */
const surface = buttonColor.variant('surface')
export const buttonSurfaceSource = variableFrom(surface, surface, { name: 'button-surface-source', address: button })

/** 混色的承载画布，默认沿用中性表面的交互状态。 */
export const buttonSurfaceCanvas = variableFrom(interactiveSurfaceColor, { name: 'button-surface-canvas', address: button })

/** 动作色在表面中的占比；分类和外部修改沿前序结果组合。 */
export const buttonSurfaceStrength = variableFrom(surfaceStrength, { name: 'button-surface-strength', address: button })

/** 默认存在感及强调/禁用都相对于同一输入；组件保留原来的四种比例。 */
const buttonOpacity = variableFrom(opacity, multiply(opacity, 0.9), {
  name: 'button-opacity', address: button,
  states: {
    disabled: base => multiply(base, 0.48 / 0.9),
    '&[data-emphasis="soft"]:not(:disabled, [data-status~="disabled"])': base => multiply(base, 0.7 / 0.9),
    '&[data-emphasis="strong"]:not(:disabled, [data-status~="disabled"])': base => multiply(base, 1 / 0.9),
  },
})

/** Button当前承载面和内容色，外部可按作用域分别声明。 */
export const buttonSurfaceColor = variableFrom(globalSurfaceColor, colorMix([buttonSurfaceSource, buttonSurfaceStrength], buttonSurfaceCanvas), { name: 'button-surface-color', address: button })
export const buttonContentColor = variableFrom(globalContentColor, globalContentColor, { name: 'button-content-color', address: button })
const buttonShadow = variableFrom(shadow.variant('control'), { name: 'button-shadow', address: button })

// 定义button的样式架构
rules(button, [
  innerText({ font: 'inherit', fontSize: buttonTextSize, emphasis: multiply(fontWeight, 7 / 4), leading: 1 }),
  contentLayout({ mode: 'center', alignSelf: 'center', gap: buttonSpacing.variant('gap'), padding: [buttonSpacing.variant('paddingBlock'), buttonSpacing.variant('paddingInline')] }),
  size({ minHeight: buttonSize }),
  boundary({ border: [boundaryWidth, 'solid', 'transparent'], radius: '999px', cornerShape: 'squircle' }),
  color({ background: buttonSurfaceColor, content: buttonContentColor }),
  elevation(buttonShadow),

  clickable({ address: button, opacity: buttonOpacity, focusColor: buttonColor.variant('boundary') }),
])

// =============================================================================
// tone 动作语气
// =============================================================================

// tone 只选择材料；声量与状态沿用各自的独立效果。
rules([...button, '&[data-tone]'], [declare(buttonContentColor, buttonColor.variant('text'))])
rules([...button, '&[data-tone="danger"]'], [declare(buttonColorInput, badColor)])

// =============================================================================
// appearance 外观形式
// =============================================================================

// outlined 保留浅底，并用当前语气的线色形成可见轮廓。
rules([...button, '&[data-appearance="outlined"]'], [
  boundary({ border: [boundaryWidth, 'solid', buttonColor.variant('boundary')] }),
])

// plain 保留透明常态与无边界，悬停和按下只增加轻量语气反馈。
const plainStrength = variableFrom(surfaceStrength, -0.18, {
  name: 'button-plain-strength',
  address: [...button, '&[data-appearance="plain"]'],
  states: { hover: base => multiply(base, 0.2 / 0.18), active: base => multiply(base, 0.24 / 0.18) },
})
const plainButton = [...button, '&[data-appearance="plain"]']
rules(plainButton, [
  modify(buttonSurfaceStrength, {
    type: 'expression',
    detail: (currentExpression) => add(currentExpression, plainStrength),
  }),
  [buttonSurfaceCanvas, 'transparent'],
  elevation('none'),
])

// filled 使用语气实底；交互时少量露出画布，避免混色抵消交互色的明度变化。
const filledStrength = variableFrom(surfaceStrength, 0.82, {
  name: 'button-filled-strength',
  address: [...button, '&[data-appearance="filled"]'],
  states: { hover: base => multiply(base, 0.67 / 0.82), active: base => multiply(base, 0.52 / 0.82) },
})
const shadowFilled = variableFrom(shadow.variant('filledControl'), {
  name: 'button-shadow-filled', address: [...button, '&[data-appearance="filled"]'],
})
const filledButton = [...button, '&[data-appearance="filled"]']
rules(filledButton, [
  modify(buttonSurfaceStrength, {
    type: 'expression',
    detail: (currentExpression) => add(currentExpression, filledStrength),
  }),
  [buttonSurfaceSource, buttonColorInput],
  declare(buttonContentColor, buttonColor.variant('content')),
  elevation(shadowFilled),
])

// =============================================================================
// status 外部状态
// =============================================================================

rules([...button, '&[data-status~="loading"]'], [[$cursor, 'progress']])
rules([...button, '&[data-status~="loading"]', whenDisabled], [[$cursor, 'not-allowed']])
