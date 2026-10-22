/** 按钮的样式效果与生效条件。

组合颜色、尺寸和布局，声明组件控制变量及各分类贡献。

组件自身的选择条件留在样式定义端，可复用效果交给 Style System。
*/
import {
  declare,
  modify,
  rules,
  add,
  variable,
  variableFrom,
  jssInnerText,
  jssContentLayout,
  jssSize,
  jssBoundary,
  jssColor,
  jssElevation,
  jssClickable,
  $cursor,
  colorMix,
  oklch,
  interactiveColor,
  badColor,
  paperColor,
  globalSurfaceColor,
  globalContentColor,
  interactiveColorStates,
  pill,
  spaceSmall,
  spaceNormal,
  spaceMedium,
  spaceLarge,
  spaceExtraLarge,
  spaceWide,
  spaceWidest,
  boundaryWidthThin,
  controlSizeSmall,
  controlSizeNormal,
  controlSizeLarge,
  controlSizeExtraLarge,
  bold,
  singleLine,
  textSizeNormal,
  textSizeLarge,
  textSizeExtraLarge,
  textSizeExtraExtraLarge,
  shadowFlat,
  shadowRaised,
  shadowElevated,
  shadowInteractive,
  disabledFade,
} from '@/style-system'
import { $opacity } from '@/style-system/pieces/keys/opacity'

const button = ['@layer uikit', `.Button`]

/** 组件的局部颜色输入；变体保留真实引用，分类只需选择一次材料。 */
export const buttonColorInput = variableFrom(interactiveColor, interactiveColor.content, { name: 'button-color-input', address: button })
/** Button 的颜色定义；使用处按 soft、strong、line、content 选择变体。 */
export const buttonColor = variable(buttonColorInput, {
  name: 'button-color',
  address: button,
  variants: {
    soft: base => oklch(base, { alpha: 0.14 }),
    strong: base => base,
    line: base => oklch(base, { alpha: 0.44 }),
    content: paperColor,
  },
})

/** 混色的动作色来源，默认使用局部语气的柔和成员。 */
export const buttonSurfaceSource = variable(buttonColor.variant('soft'), { name: 'button-surface-source', address: button })

/** 混色的承载画布，默认沿用中性表面的交互状态。 */
export const buttonSurfaceCanvas = variable(interactiveColorStates({ base: globalSurfaceColor }), { name: 'button-surface-canvas', address: button })

/** 动作色在表面中的占比；分类和外部修改沿前序结果组合。 */
export const buttonSurfaceStrength = variable(0.18, {
  name: 'button-surface-strength',
  address: button,
  states: { hover: 0.28, active: 0.38 },
})

/** 整体存在感的人工配方：普通 0.9，柔和 0.7，强调 1；禁用始终沿用统一淡化。 */
const buttonOpacity = variable(0.9, {
  name: 'button-opacity',
  address: button,
  states: { disabled: disabledFade },
})

/** Button当前承载面和内容色，外部可按作用域分别声明。 */
export const buttonSurfaceColor = variable(colorMix([buttonSurfaceSource, buttonSurfaceStrength], buttonSurfaceCanvas), { name: 'button-surface-color', address: button })
export const buttonContentColor = variable(globalContentColor, { name: 'button-content-color', address: button })
const buttonShadow = variableFrom(shadowInteractive, shadowInteractive.content, { name: 'button-shadow', address: button })

// 定义button的样式架构
rules(button, [
  jssInnerText({ font: 'inherit', fontSize: textSizeLarge, emphasis: bold, leading: singleLine }),
  jssContentLayout({ mode: 'center', alignSelf: 'center', gap: spaceNormal, padding: [spaceNormal, spaceExtraLarge] }),
  jssSize({ minHeight: controlSizeNormal }),
  jssBoundary({ border: [boundaryWidthThin, 'solid', 'transparent'], radius: pill, cornerShape: 'squircle' }),
  jssColor({ background: buttonSurfaceColor, content: buttonContentColor }),
  jssElevation(buttonShadow),

  jssClickable({ address: button, opacity: buttonOpacity, focusColor: buttonColor.variant('line') }),
])

// =============================================================================
// tone 动作语气
// =============================================================================

// tone 只选择材料；声量与状态沿用各自的独立效果。
rules([...button, '&[data-tone]'], [declare(buttonContentColor, buttonColor.variant('strong'))])
rules([...button, '&[data-tone="danger"]'], [declare(buttonColorInput, badColor)])

// =============================================================================
// appearance 外观形式
// =============================================================================

// outlined 保留浅底，并用当前语气的线色形成可见轮廓。
rules([...button, '&[data-appearance="outlined"]'], [
  jssBoundary({ border: [boundaryWidthThin, 'solid', buttonColor.variant('line')] }),
])

// plain 保留透明常态与无边界，悬停和按下只增加轻量语气反馈。
const plainStrength = variable(-0.18, {
  name: 'button-plain-strength',
  address: [...button, '&[data-appearance="plain"]'],
  states: { hover: -0.2, active: -0.24 },
})
const plainButton = [...button, '&[data-appearance="plain"]']
rules(plainButton, [
  modify(buttonSurfaceStrength, {
    type: 'expression',
    detail: (currentExpression) => add(currentExpression, plainStrength),
  }),
  [buttonSurfaceCanvas, 'transparent'],
  jssElevation(shadowFlat),
])

// filled 使用语气实底；交互时少量露出画布，避免混色抵消交互色的明度变化。
const filledStrength = variable(0.82, {
  name: 'button-filled-strength',
  address: [...button, '&[data-appearance="filled"]'],
  states: { hover: 0.67, active: 0.52 },
})
const shadowFilled = variable(shadowRaised, {
  name: 'button-shadow-filled',
  address: [...button, '&[data-appearance="filled"]'],
  states: { hover: shadowElevated, active: shadowFlat, disabled: shadowFlat },
})
const filledButton = [...button, '&[data-appearance="filled"]']
rules(filledButton, [
  modify(buttonSurfaceStrength, {
    type: 'expression',
    detail: (currentExpression) => add(currentExpression, filledStrength),
  }),
  [buttonSurfaceSource, buttonColorInput],
  declare(buttonContentColor, buttonColor.variant('content')),
  jssElevation(shadowFilled),
])

// emphasis 只调整整体存在感，不改变外观、语气或尺寸；禁用状态由 Variable 保持。
const softOpacity = variableFrom(buttonOpacity, 0.7, 'button-soft-opacity')
rules([...button, '&[data-emphasis="soft"]'], [[$opacity, softOpacity]])
const strongOpacity = variableFrom(buttonOpacity, 1, 'button-strong-opacity')
rules([...button, '&[data-emphasis="strong"]'], [[$opacity, strongOpacity]])

// =============================================================================
// size 物理尺寸
// =============================================================================

rules(
  [...button, '&[data-size="small"]'],
  [
    jssInnerText({ fontSize: textSizeNormal }),
    jssContentLayout({ gap: spaceSmall, padding: [spaceSmall, spaceMedium] }),
    jssSize({ minHeight: controlSizeSmall }),
  ],
)

rules(
  [...button, '&[data-size="large"]'],
  [
    jssInnerText({ fontSize: textSizeExtraLarge }),
    jssContentLayout({ gap: spaceMedium, padding: [spaceNormal, spaceWide] }),
    jssSize({ minHeight: controlSizeLarge }),
  ],
)

rules(
  [...button, '&[data-size="xlarge"]'],
  [
    jssInnerText({ fontSize: textSizeExtraExtraLarge }),
    jssContentLayout({ gap: spaceLarge, padding: [spaceMedium, spaceWidest] }),
    jssSize({ minHeight: controlSizeExtraLarge }),
  ],
)

// =============================================================================
// status 外部状态
// =============================================================================

const cursorLoading = variable('progress', {
  name: 'button-cursor-loading',
  address: [...button, '&[data-status~="loading"]'],
  states: { disabled: 'not-allowed' },
})

rules([...button, '&[data-status~="loading"]'], [[$cursor, cursorLoading]])
