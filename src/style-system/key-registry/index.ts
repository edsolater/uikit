/**
 * JSS 属性名称的全局注册表。
 *
 * 静态汇总全部属性目标，并承接显式登记的自定义名称。
 *
 * 保证字符串入口完整可用，不依赖具名 Key 的导入副作用。
 */
import type { JSSKeyDefinition } from '@/style-system/key-definition'
import { anchorPositioningKeys } from './anchor-positioning'
import { animationsKeys } from './animations'
import { backgroundsAndBordersKeys } from './backgrounds-and-borders'
import { basicUserInterfaceKeys } from './basic-user-interface'
import { boxAlignmentKeys } from './box-alignment'
import { boxModelKeys } from './box-model'
import { boxSizingKeys } from './box-sizing'
import { cascadingAndInheritanceKeys } from './cascading-and-inheritance'
import { colorKeys } from './color'
import { compositingAndBlendingKeys } from './compositing-and-blending'
import { conditionalRulesKeys } from './conditional-rules'
import { containmentKeys } from './containment'
import { displayKeys } from './display'
import { filterEffectsKeys } from './filter-effects'
import { flexibleBoxLayoutKeys } from './flexible-box-layout'
import { fontsKeys } from './fonts'
import { fragmentationKeys } from './fragmentation'
import { gapsKeys } from './gaps'
import { generatedContentKeys } from './generated-content'
import { gridLayoutKeys } from './grid-layout'
import { imagesKeys } from './images'
import { inlineKeys } from './inline'
import { listsAndCountersKeys } from './lists-and-counters'
import { logicalPropertiesAndValuesKeys } from './logical-properties-and-values'
import { maskingKeys } from './masking'
import { mathmlKeys } from './mathml'
import { mobileTextSizeAdjustmentKeys } from './mobile-text-size-adjustment'
import { motionPathKeys } from './motion-path'
import { multiColumnLayoutKeys } from './multi-column-layout'
import { nonStandardKeys } from './non-standard'
import { overflowKeys } from './overflow'
import { overscrollBehaviorKeys } from './overscroll-behavior'
import { pagedMediaKeys } from './paged-media'
import { pointerEventsKeys } from './pointer-events'
import { positionedLayoutKeys } from './positioned-layout'
import { rhythmicSizingKeys } from './rhythmic-sizing'
import { rubyKeys } from './ruby'
import { scrollAnchoringKeys } from './scroll-anchoring'
import { scrollDrivenAnimationsKeys } from './scroll-driven-animations'
import { scrollSnapKeys } from './scroll-snap'
import { scrollbarsStylingKeys } from './scrollbars-styling'
import { shapesKeys } from './shapes'
import { speechKeys } from './speech'
import { svgKeys } from './svg'
import { tableKeys } from './table'
import { textKeys } from './text'
import { textDecorationKeys } from './text-decoration'
import { transformsKeys } from './transforms'
import { transitionsKeys } from './transitions'
import { valuesAndUnitsKeys } from './values-and-units'
import { viewTransitionsKeys } from './view-transitions'
import { viewportKeys } from './viewport'
import { willChangeKeys } from './will-change'
import { writingModesKeys } from './writing-modes'

export * from './anchor-positioning'
export * from './animations'
export * from './backgrounds-and-borders'
export * from './basic-user-interface'
export * from './box-alignment'
export * from './box-model'
export * from './box-sizing'
export * from './cascading-and-inheritance'
export * from './color'
export * from './compositing-and-blending'
export * from './conditional-rules'
export * from './containment'
export * from './display'
export * from './filter-effects'
export * from './flexible-box-layout'
export * from './fonts'
export * from './fragmentation'
export * from './gaps'
export * from './generated-content'
export * from './grid-layout'
export * from './images'
export * from './inline'
export * from './lists-and-counters'
export * from './logical-properties-and-values'
export * from './masking'
export * from './mathml'
export * from './mobile-text-size-adjustment'
export * from './motion-path'
export * from './multi-column-layout'
export * from './non-standard'
export * from './overflow'
export * from './overscroll-behavior'
export * from './paged-media'
export * from './pointer-events'
export * from './positioned-layout'
export * from './rhythmic-sizing'
export * from './ruby'
export * from './scroll-anchoring'
export * from './scroll-driven-animations'
export * from './scroll-snap'
export * from './scrollbars-styling'
export * from './shapes'
export * from './speech'
export * from './svg'
export * from './table'
export * from './text'
export * from './text-decoration'
export * from './transforms'
export * from './transitions'
export * from './values-and-units'
export * from './view-transitions'
export * from './viewport'
export * from './will-change'
export * from './writing-modes'

/** CSS 原名及显式扩展名称共用的属性目标表。 */
export const keyRegistry: Record<string, JSSKeyDefinition> = Object.assign(
  Object.create(null),
  {
    ...anchorPositioningKeys,
    ...animationsKeys,
    ...backgroundsAndBordersKeys,
    ...basicUserInterfaceKeys,
    ...boxAlignmentKeys,
    ...boxModelKeys,
    ...boxSizingKeys,
    ...cascadingAndInheritanceKeys,
    ...colorKeys,
    ...compositingAndBlendingKeys,
    ...conditionalRulesKeys,
    ...containmentKeys,
    ...displayKeys,
    ...filterEffectsKeys,
    ...flexibleBoxLayoutKeys,
    ...fontsKeys,
    ...fragmentationKeys,
    ...gapsKeys,
    ...generatedContentKeys,
    ...gridLayoutKeys,
    ...imagesKeys,
    ...inlineKeys,
    ...listsAndCountersKeys,
    ...logicalPropertiesAndValuesKeys,
    ...maskingKeys,
    ...mathmlKeys,
    ...mobileTextSizeAdjustmentKeys,
    ...motionPathKeys,
    ...multiColumnLayoutKeys,
    ...nonStandardKeys,
    ...overflowKeys,
    ...overscrollBehaviorKeys,
    ...pagedMediaKeys,
    ...pointerEventsKeys,
    ...positionedLayoutKeys,
    ...rhythmicSizingKeys,
    ...rubyKeys,
    ...scrollAnchoringKeys,
    ...scrollDrivenAnimationsKeys,
    ...scrollSnapKeys,
    ...scrollbarsStylingKeys,
    ...shapesKeys,
    ...speechKeys,
    ...svgKeys,
    ...tableKeys,
    ...textKeys,
    ...textDecorationKeys,
    ...transformsKeys,
    ...transitionsKeys,
    ...valuesAndUnitsKeys,
    ...viewTransitionsKeys,
    ...viewportKeys,
    ...willChangeKeys,
    ...writingModesKeys,
  },
)
