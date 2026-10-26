/**
 * 弹性布局的属性目标。
 *
 * 组织轴向、换行、伸缩与基础尺寸以形成弹性布局。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

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

/** 弹性布局的 CSS 原名与具名 Key 对应表。 */
export const flexKeys = {
  'flex': $flex,
  'flex-basis': $flexBasis,
  'flex-direction': $flexDirection,
  'flex-flow': $flexFlow,
  'flex-grow': $flexGrow,
  'flex-line-count': $flexLineCount,
  'flex-shrink': $flexShrink,
  'flex-wrap': $flexWrap,
}
