/**
 * 按用途组织的 JSS 属性全局注册表。
 *
 * 静态汇总预置属性目标，并承接显式登记的自定义名称。
 *
 * 让字符串声明直接取得属性身份，无需先导入具名 Key。
 */
import type { JSSKeyDefinition } from '@/style-system/key-definition'
import { alignmentKeys } from './alignment'
import { animationKeys } from './animation'
import { appearanceKeys } from './appearance'
import { backgroundKeys } from './background'
import { baselineKeys } from './baseline'
import { boundaryKeys } from './boundary'
import { caretKeys } from './caret'
import { colorAdjustmentKeys } from './color-adjustment'
import { colorKeys } from './color'
import { columnsKeys } from './columns'
import { compositingKeys } from './compositing'
import { containerKeys } from './container'
import { containmentKeys } from './containment'
import { contentKeys } from './content'
import { counterKeys } from './counter'
import { cursorKeys } from './cursor'
import { decorationBreakKeys } from './decoration-break'
import { displayKeys } from './display'
import { filterKeys } from './filter'
import { flexKeys } from './flex'
import { floatKeys } from './float'
import { fontKeys } from './font'
import { fragmentationKeys } from './fragmentation'
import { gapDecorationKeys } from './gap-decoration'
import { gapKeys } from './gap'
import { gridKeys } from './grid'
import { hitTestingKeys } from './hit-testing'
import { imageRenderingKeys } from './image-rendering'
import { initialLetterKeys } from './initial-letter'
import { interactivityKeys } from './interactivity'
import { interestKeys } from './interest'
import { lineBoxKeys } from './line-box'
import { listKeys } from './list'
import { marginKeys } from './margin'
import { maskKeys } from './mask'
import { mathKeys } from './math'
import { motionPathKeys } from './motion-path'
import { objectFitKeys } from './object-fit'
import { orderKeys } from './order'
import { overflowKeys } from './overflow'
import { overscrollKeys } from './overscroll'
import { paddingKeys } from './padding'
import { pageKeys } from './page'
import { positionKeys } from './position'
import { readingOrderKeys } from './reading-order'
import { resetKeys } from './reset'
import { resizeKeys } from './resize'
import { rubyKeys } from './ruby'
import { scrollAnchorKeys } from './scroll-anchor'
import { scrollBehaviorKeys } from './scroll-behavior'
import { scrollMarginKeys } from './scroll-margin'
import { scrollNavigationKeys } from './scroll-navigation'
import { scrollPaddingKeys } from './scroll-padding'
import { scrollSnapKeys } from './scroll-snap'
import { scrollbarKeys } from './scrollbar'
import { selectionKeys } from './selection'
import { sizeInterpolationKeys } from './size-interpolation'
import { sizeKeys } from './size'
import { stackingKeys } from './stacking'
import { svgColorKeys } from './svg-color'
import { svgFillKeys } from './svg-fill'
import { svgGeometryKeys } from './svg-geometry'
import { svgGradientKeys } from './svg-gradient'
import { svgMarkerKeys } from './svg-marker'
import { svgPaintOrderKeys } from './svg-paint-order'
import { svgRenderingKeys } from './svg-rendering'
import { svgStrokeKeys } from './svg-stroke'
import { svgTextKeys } from './svg-text'
import { tableKeys } from './table'
import { textAlignKeys } from './text-align'
import { textDecorationKeys } from './text-decoration'
import { textEmphasisKeys } from './text-emphasis'
import { textIndentKeys } from './text-indent'
import { textOverflowKeys } from './text-overflow'
import { textShadowKeys } from './text-shadow'
import { textSizingKeys } from './text-sizing'
import { textSpacingKeys } from './text-spacing'
import { textTransformKeys } from './text-transform'
import { textWrapKeys } from './text-wrap'
import { touchActionKeys } from './touch-action'
import { transformKeys } from './transform'
import { transitionKeys } from './transition'
import { viewTransitionKeys } from './view-transition'
import { visibilityKeys } from './visibility'
import { willChangeKeys } from './will-change'
import { writingModeKeys } from './writing-mode'
import { zoomKeys } from './zoom'

export * from './alignment'
export * from './animation'
export * from './appearance'
export * from './background'
export * from './baseline'
export * from './boundary'
export * from './caret'
export * from './color-adjustment'
export * from './color'
export * from './columns'
export * from './compositing'
export * from './container'
export * from './containment'
export * from './content'
export * from './counter'
export * from './cursor'
export * from './decoration-break'
export * from './display'
export * from './filter'
export * from './flex'
export * from './float'
export * from './font'
export * from './fragmentation'
export * from './gap-decoration'
export * from './gap'
export * from './grid'
export * from './hit-testing'
export * from './image-rendering'
export * from './initial-letter'
export * from './interactivity'
export * from './interest'
export * from './line-box'
export * from './list'
export * from './margin'
export * from './mask'
export * from './math'
export * from './motion-path'
export * from './object-fit'
export * from './order'
export * from './overflow'
export * from './overscroll'
export * from './padding'
export * from './page'
export * from './position'
export * from './reading-order'
export * from './reset'
export * from './resize'
export * from './ruby'
export * from './scroll-anchor'
export * from './scroll-behavior'
export * from './scroll-margin'
export * from './scroll-navigation'
export * from './scroll-padding'
export * from './scroll-snap'
export * from './scrollbar'
export * from './selection'
export * from './size-interpolation'
export * from './size'
export * from './stacking'
export * from './svg-color'
export * from './svg-fill'
export * from './svg-geometry'
export * from './svg-gradient'
export * from './svg-marker'
export * from './svg-paint-order'
export * from './svg-rendering'
export * from './svg-stroke'
export * from './svg-text'
export * from './table'
export * from './text-align'
export * from './text-decoration'
export * from './text-emphasis'
export * from './text-indent'
export * from './text-overflow'
export * from './text-shadow'
export * from './text-sizing'
export * from './text-spacing'
export * from './text-transform'
export * from './text-wrap'
export * from './touch-action'
export * from './transform'
export * from './transition'
export * from './view-transition'
export * from './visibility'
export * from './will-change'
export * from './writing-mode'
export * from './zoom'

/** CSS 原名及显式扩展名称共用的属性目标表。 */
export const keyRegistry: Record<string, JSSKeyDefinition> = Object.assign(
  Object.create(null),
  {
    ...alignmentKeys,
    ...animationKeys,
    ...appearanceKeys,
    ...backgroundKeys,
    ...baselineKeys,
    ...boundaryKeys,
    ...caretKeys,
    ...colorAdjustmentKeys,
    ...colorKeys,
    ...columnsKeys,
    ...compositingKeys,
    ...containerKeys,
    ...containmentKeys,
    ...contentKeys,
    ...counterKeys,
    ...cursorKeys,
    ...decorationBreakKeys,
    ...displayKeys,
    ...filterKeys,
    ...flexKeys,
    ...floatKeys,
    ...fontKeys,
    ...fragmentationKeys,
    ...gapDecorationKeys,
    ...gapKeys,
    ...gridKeys,
    ...hitTestingKeys,
    ...imageRenderingKeys,
    ...initialLetterKeys,
    ...interactivityKeys,
    ...interestKeys,
    ...lineBoxKeys,
    ...listKeys,
    ...marginKeys,
    ...maskKeys,
    ...mathKeys,
    ...motionPathKeys,
    ...objectFitKeys,
    ...orderKeys,
    ...overflowKeys,
    ...overscrollKeys,
    ...paddingKeys,
    ...pageKeys,
    ...positionKeys,
    ...readingOrderKeys,
    ...resetKeys,
    ...resizeKeys,
    ...rubyKeys,
    ...scrollAnchorKeys,
    ...scrollBehaviorKeys,
    ...scrollMarginKeys,
    ...scrollNavigationKeys,
    ...scrollPaddingKeys,
    ...scrollSnapKeys,
    ...scrollbarKeys,
    ...selectionKeys,
    ...sizeInterpolationKeys,
    ...sizeKeys,
    ...stackingKeys,
    ...svgColorKeys,
    ...svgFillKeys,
    ...svgGeometryKeys,
    ...svgGradientKeys,
    ...svgMarkerKeys,
    ...svgPaintOrderKeys,
    ...svgRenderingKeys,
    ...svgStrokeKeys,
    ...svgTextKeys,
    ...tableKeys,
    ...textAlignKeys,
    ...textDecorationKeys,
    ...textEmphasisKeys,
    ...textIndentKeys,
    ...textOverflowKeys,
    ...textShadowKeys,
    ...textSizingKeys,
    ...textSpacingKeys,
    ...textTransformKeys,
    ...textWrapKeys,
    ...touchActionKeys,
    ...transformKeys,
    ...transitionKeys,
    ...viewTransitionKeys,
    ...visibilityKeys,
    ...willChangeKeys,
    ...writingModeKeys,
    ...zoomKeys,
  },
)
