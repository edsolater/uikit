import { modification } from '@/style-system/modification'
import { variable } from '@/style-system/variable'
import { variableCluster } from '@/style-system/variable-cluster'
import { add } from '../../functions/calc'
import { relativeOKLCH } from '../../functions/relative-oklch'
import { brand, brandColor } from './brand-color'
import { paperColor } from './palette'
import { baseUIColorStructure, createColorModificationByDiff } from './ui-color-structure'
import { type ColorMaterial, hue, chroma, lightness } from '@/color-system'

/** 交互色直接沿用品牌材料及其感知配置。
 * 明度 0.25 保留品牌的亮暗适应，彩度 0.15 保留品牌的鲜明程度，色相 0.02 保留品牌身份。
 * 交互用途本身不构成另一套环境响应的理由，因此不另设比例。
 */
export const interactive: ColorMaterial = brand

export const interactiveColor = variable(brandColor, {
  name: 'interactive-color',
  registration: { syntax: '*', inherits: true },
  states: {
    hover: relativeOKLCH(
      brandColor,
      modification({
        type: 'color',
        detail: {
          lightness: (currentExpression) => add(currentExpression, -0.04),
          chroma: (currentExpression) => add(currentExpression, 0.01),
        },
      }),
    ),
    active: relativeOKLCH(
      brandColor,
      modification({
        type: 'color',
        detail: {
          lightness: (currentExpression) => add(currentExpression, -0.08),
          chroma: (currentExpression) => add(currentExpression, -0.01),
        },
      }),
    ),
  },
})
export const interactiveColors = variableCluster(
  baseUIColorStructure({
    base: interactiveColor,
    softAlpha: 0.14,
    lineAlpha: 0.48,
    foreground: paperColor,
  }),
)

/** 高亮色改变品牌基色，保留品牌的感知配置。
 * 明度 0.25 让高亮色适应亮暗而不完全趋向背景，彩度 0.15 避免派生色被环境冲淡，色相 0.02 保留派生色身份。
 * 高亮差异由下面的基色变换表达，因此不再通过另一套感知比例重复加强。
 */
export const highlight: ColorMaterial = hue(
  chroma(
    lightness(brand, (value) => value + 0.04),
    (value) => value + 0.01,
  ),
  (value) => value - 18,
)

export const highlightColor = variable(
  relativeOKLCH(brandColor, createColorModificationByDiff({ original: brand, target: highlight })),
  'highlight-color',
)
export const highlightColors = variableCluster(
  baseUIColorStructure({
    base: highlightColor,
    softAlpha: 0.14,
    lineAlpha: 0.42,
    foreground: paperColor,
    strong: relativeOKLCH(
      highlightColor,
      modification({
        type: 'color',
        detail: {
          lightness: (currentExpression) => add(currentExpression, 0.08),
          chroma: (currentExpression) => add(currentExpression, 0.02),
        },
      }),
    ),
  }),
)
