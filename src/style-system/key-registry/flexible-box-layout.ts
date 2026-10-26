/**
 * CSS flexible-box-layout 模块的属性目标。
 *
 * 定义具名 Key 及 CSS 原名对应表。
 *
 * 让字符串与具名声明共用同一属性身份。
 */
import { key } from '@/style-system/key-definition'

// --- flex 属性族 ---

export const $flex = key('flex')

export const $flexBasis = key('flex-basis')

/** flex-direction Key，选择 Flex 主轴方向。 */
export const $flexDirection = key('flex-direction')

/** flex-flow Key，同时表达 Flex 主轴方向与换行方式。 */
export const $flexFlow = key('flex-flow')

export const $flexGrow = key('flex-grow')

export const $flexLineCount = key('flex-line-count')

export const $flexShrink = key('flex-shrink')

/** flex-wrap Key，选择 Flex 子项是否换行。 */
export const $flexWrap = key('flex-wrap')

/** flexible-box-layout 模块的 CSS 原名与具名 Key 对应表。 */
export const flexibleBoxLayoutKeys = {
  'flex': $flex,
  'flex-basis': $flexBasis,
  'flex-direction': $flexDirection,
  'flex-flow': $flexFlow,
  'flex-grow': $flexGrow,
  'flex-line-count': $flexLineCount,
  'flex-shrink': $flexShrink,
  'flex-wrap': $flexWrap,
}
