/** 按钮的样式效果与生效条件。

组合颜色、尺寸和布局，声明组件控制变量及各分类贡献。

组件自身的选择条件留在样式定义端，可复用效果交给 Style System。
*/
import { declare } from '../../../style-system/declaration'
import { modify } from '../../../style-system/variable-modify'
import {
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
} from '../../../style-system'
import { surfaceColor, foregroundColor } from '../../../style-system/pieces/roles/color'
import { $cursor } from '../../../style-system/pieces/keys/interaction'
import { colorMix } from '../../../style-system/pieces/contents/functions/color-mix'
import {
  foregroundColorInteractive,
  interactiveColor,
  highlightColor,
  badColor,
  toneColor,
  surfaceColorInteractive,
} from '../../../style-system/pieces/contents/atoms/color/colors'
import { pill } from '../../../style-system/pieces/contents/atoms/radius'
import {
  spaceSmall,
  spaceNormal,
  spaceMedium,
  spaceLarge,
  spaceExtraLarge,
  spaceWide,
  spaceWidest,
  boundaryWidthThin,
} from '../../../style-system/pieces/contents/atoms/space'
import {
  controlSizeSmall,
  controlSizeNormal,
  controlSizeLarge,
  controlSizeExtraLarge,
} from '../../../style-system/pieces/contents/atoms/size'
import {
  bold,
  singleLine,
  textSizeNormal,
  textSizeLarge,
  textSizeExtraLarge,
  textSizeExtraExtraLarge,
} from '../../../style-system/pieces/contents/atoms/font'
import {
  shadowFlat,
  shadowRaised,
  shadowElevated,
  shadowInteractive,
} from '../../../style-system/pieces/contents/atoms/shadow'
import { Button } from './Button'

const button = ['@layer uikit', `.${Button.name}`]


/** 混色的动作色来源，默认使用局部语气的柔和成员。 */
export const buttonSurfaceSource = variable(toneColor('soft'), { name: 'button-surface-source' })

/** 混色的承载画布，默认沿用中性表面的交互状态。 */
export const buttonSurfaceCanvas = variable(surfaceColorInteractive, { name: 'button-surface-canvas' })

/** 动作色在表面中的占比；分类和外部修改沿前序结果组合。 */
export const buttonSurfaceStrength = variable(0.18, {
  name: 'button-surface-strength',
  states: { hover: 0.28, active: 0.38 },
})


// 定义button的样式架构
rules(button, [
  [toneColor, interactiveColor],
  declare(buttonSurfaceStrength),
  declare(surfaceColor, colorMix([buttonSurfaceSource, buttonSurfaceStrength], buttonSurfaceCanvas)),
  declare(foregroundColor, foregroundColorInteractive),

  innerText({ font: 'inherit', fontSize: textSizeLarge, emphasis: bold, leading: singleLine }),
  contentLayout({ mode: 'center', alignSelf: 'center', gap: spaceNormal, padding: [spaceNormal, spaceExtraLarge] }),
  size({ minHeight: controlSizeNormal }),
  boundary({ border: [boundaryWidthThin, 'solid', 'transparent'], radius: pill, cornerShape: 'squircle' }),
  color({ background: surfaceColor, foreground: foregroundColor }),
  elevation(shadowInteractive),

  clickable(),
])

// =============================================================================
// tone 动作语气
// =============================================================================



// tone 只选择材料；声量与状态沿用各自的独立效果。
rules([...button, '&[data-tone]'], [declare(foregroundColor, toneColor('strong'))])
rules([...button, '&[data-tone="accent"]'], [[toneColor, highlightColor]])
rules([...button, '&[data-tone="danger"]'], [[toneColor, badColor]])

// =============================================================================
// variant 动作声量
// =============================================================================

// bare 保留透明常态，悬停和按下只增加轻量语气反馈。
const bareStrength = variable(-0.18, {
  name: 'button-bare-strength',
  states: { hover: -0.2, active: -0.24 },
})
const bareButton = [...button, '&[data-variant="bare"]']
rules(bareButton, [
  modify(buttonSurfaceStrength, { type: 'expression', detail: currentExpression => add(currentExpression, bareStrength) }),
  [buttonSurfaceCanvas, 'transparent'],
  elevation(shadowFlat),
])

// solid 使用语气实底与对应前景，交互时露出中性画布形成层次。
const solidStrength = variable(0.82, {
  name: 'button-solid-strength',
  states: { hover: 0.62, active: 0.42 },
})
const shadowSolid = variable(shadowRaised, {
  name: 'button-shadow-solid',
  states: { hover: shadowElevated, active: shadowFlat, disabled: shadowFlat },
})
const solidButton = [...button, '&[data-variant="solid"]']
rules(solidButton, [
  modify(buttonSurfaceStrength, { type: 'expression', detail: currentExpression => add(currentExpression, solidStrength) }),
  [buttonSurfaceSource, toneColor],
  declare(foregroundColor, toneColor('foreground')),
  elevation(shadowSolid),
])

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
