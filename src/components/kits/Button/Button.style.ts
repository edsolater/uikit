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
  innerText,
  contentLayout,
  size,
  boundary,
  color,
  elevation,
  clickable,
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

/** Button自己的语气与颜色定义；危险条件分别声明所需颜色，不建立整组协议。 */
export const buttonToneColor = variable(interactiveColor, 'button-tone-color')
export const buttonSoftColor = variable(oklch(buttonToneColor, { alpha: 0.14 }), 'button-soft-color')
export const buttonStrongColor = variable(buttonToneColor, 'button-strong-color')
export const buttonLineColor = variable(oklch(buttonToneColor, { alpha: 0.44 }), 'button-line-color')
export const buttonToneContentColor = variable(paperColor, 'button-tone-content-color')

/** 混色的动作色来源，默认使用局部语气的柔和成员。 */
export const buttonSurfaceSource = variable(buttonSoftColor, { name: 'button-surface-source' })

/** 混色的承载画布，默认沿用中性表面的交互状态。 */
export const buttonSurfaceCanvas = variable(interactiveColorStates({ base: globalSurfaceColor }), { name: 'button-surface-canvas' })

/** 动作色在表面中的占比；分类和外部修改沿前序结果组合。 */
export const buttonSurfaceStrength = variable(0.18, {
  name: 'button-surface-strength',
  states: { hover: 0.28, active: 0.38 },
})

/** 整体存在感的人工配方：普通 0.9，柔和 0.7，强调 1；禁用始终沿用统一淡化。 */
const buttonOpacity = variable(0.9, {
  name: 'button-opacity',
  states: { disabled: disabledFade },
})

/** Button当前承载面和内容色，外部可按作用域分别声明。 */
export const buttonSurfaceColor = variable(colorMix([buttonSurfaceSource, buttonSurfaceStrength], buttonSurfaceCanvas), 'button-surface-color')
export const buttonContentColor = variable(globalContentColor, 'button-content-color')

// 定义button的样式架构
rules(button, [
  declare(buttonToneColor),
  declare(buttonSoftColor),
  declare(buttonStrongColor),
  declare(buttonLineColor),
  declare(buttonToneContentColor),
  declare(buttonSurfaceSource),
  declare(buttonSurfaceCanvas),
  declare(buttonSurfaceStrength),
  declare(buttonSurfaceColor),
  declare(buttonContentColor),

  innerText({ font: 'inherit', fontSize: textSizeLarge, emphasis: bold, leading: singleLine }),
  contentLayout({ mode: 'center', alignSelf: 'center', gap: spaceNormal, padding: [spaceNormal, spaceExtraLarge] }),
  size({ minHeight: controlSizeNormal }),
  boundary({ border: [boundaryWidthThin, 'solid', 'transparent'], radius: pill, cornerShape: 'squircle' }),
  color({ background: buttonSurfaceColor, content: buttonContentColor }),
  elevation(shadowInteractive),

  clickable({ opacity: buttonOpacity, focusColor: buttonLineColor }),
])

// =============================================================================
// tone 动作语气
// =============================================================================

// tone 只选择材料；声量与状态沿用各自的独立效果。
rules([...button, '&[data-tone]'], [declare(buttonContentColor, buttonStrongColor)])
rules([...button, '&[data-tone="danger"]'], [
  declare(buttonToneColor, badColor),
  declare(buttonSoftColor, oklch(badColor, { alpha: 0.14 })),
  declare(buttonStrongColor, badColor),
  declare(buttonLineColor, oklch(badColor, { alpha: 0.44 })),
  declare(buttonToneContentColor, paperColor),
])

// =============================================================================
// appearance 外观形式
// =============================================================================

// outlined 保留浅底，并用当前语气的线色形成可见轮廓。
rules([...button, '&[data-appearance="outlined"]'], [
  boundary({ border: [boundaryWidthThin, 'solid', buttonLineColor] }),
])

// plain 保留透明常态与无边界，悬停和按下只增加轻量语气反馈。
const plainStrength = variable(-0.18, {
  name: 'button-plain-strength',
  states: { hover: -0.2, active: -0.24 },
})
const plainButton = [...button, '&[data-appearance="plain"]']
rules(plainButton, [
  modify(buttonSurfaceStrength, {
    type: 'expression',
    detail: (currentExpression) => add(currentExpression, plainStrength),
  }),
  [buttonSurfaceCanvas, 'transparent'],
  elevation(shadowFlat),
])

// filled 使用语气实底；交互时少量露出画布，避免混色抵消交互色的明度变化。
const filledStrength = variable(0.82, {
  name: 'button-filled-strength',
  states: { hover: 0.67, active: 0.52 },
})
const shadowFilled = variable(shadowRaised, {
  name: 'button-shadow-filled',
  states: { hover: shadowElevated, active: shadowFlat, disabled: shadowFlat },
})
const filledButton = [...button, '&[data-appearance="filled"]']
rules(filledButton, [
  modify(buttonSurfaceStrength, {
    type: 'expression',
    detail: (currentExpression) => add(currentExpression, filledStrength),
  }),
  [buttonSurfaceSource, buttonToneColor],
  declare(buttonContentColor, buttonToneContentColor),
  elevation(shadowFilled),
])

// emphasis 只调整整体存在感，不改变外观、语气或尺寸；禁用状态由 Variable 保持。
const softOpacity = variable(0.7, { name: 'button-soft-opacity', states: { disabled: disabledFade } })
rules([...button, '&[data-emphasis="soft"]'], [[$opacity, softOpacity]])
const strongOpacity = variable(1, { name: 'button-strong-opacity', states: { disabled: disabledFade } })
rules([...button, '&[data-emphasis="strong"]'], [[$opacity, strongOpacity]])

// =============================================================================
// size 物理尺寸
// =============================================================================

rules(
  [...button, '&[data-size="small"]'],
  [
    innerText({ fontSize: textSizeNormal }),
    contentLayout({ gap: spaceSmall, padding: [spaceSmall, spaceMedium] }),
    size({ minHeight: controlSizeSmall }),
  ],
)

rules(
  [...button, '&[data-size="large"]'],
  [
    innerText({ fontSize: textSizeExtraLarge }),
    contentLayout({ gap: spaceMedium, padding: [spaceNormal, spaceWide] }),
    size({ minHeight: controlSizeLarge }),
  ],
)

rules(
  [...button, '&[data-size="xlarge"]'],
  [
    innerText({ fontSize: textSizeExtraExtraLarge }),
    contentLayout({ gap: spaceLarge, padding: [spaceMedium, spaceWidest] }),
    size({ minHeight: controlSizeExtraLarge }),
  ],
)

// =============================================================================
// status 外部状态
// =============================================================================

const cursorLoading = variable('progress', {
  name: 'button-cursor-loading',
  states: { disabled: 'not-allowed' },
})

rules([...button, '&[data-status~="loading"]'], [[$cursor, cursorLoading]])
