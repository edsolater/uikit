/** 动作用途的颜色变量与颜色族。
 *
 * 交互状态和高亮变化引用当前品牌颜色，族成员由共享生成器提供。
 *
 * 用途配方留在样式层，局部品牌覆盖由浏览器继续传递。
 */
import { modification } from '@/style-system/modification'
import { variable } from '@/style-system/variable'
import { variableCluster } from '@/style-system/variable-cluster'
import { add } from '../../functions/calc'
import { relativeOKLCH } from '../../functions/relative-oklch'
import { brandColor } from './brand-color'
import { paperColor } from './palette'
import { baseUIColorStructure } from './ui-color-structure'
import { interactiveColorStates } from './ui-variable-structure'

export const interactiveColor = variable(interactiveColorStates({ base: brandColor, chromaResponse: 1 }), {
  name: 'interactive-color',
  registration: { syntax: '*', inherits: true },
})
export const interactiveColors = variableCluster(
  baseUIColorStructure({
    base: interactiveColor,
    content: paperColor,
  }),
)

/** 高亮色在当前品牌颜色上增加明度和彩度，并将色相偏移 -18°。 */
export const highlightColor = variable(
  relativeOKLCH(brandColor, modification({
    type: 'color',
    detail: {
      lightness: current => add(current, 0.04),
      chroma: current => add(current, 0.01),
      hue: current => add(current, -18),
    },
  })),
  'highlight-color',
)
export const highlightColors = variableCluster(
  baseUIColorStructure({
    base: highlightColor,
    content: paperColor,
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
