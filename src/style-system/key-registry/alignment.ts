/**
 * 布局对齐的属性目标。
 *
 * 用 align/justify/place 表达项目或内容在可用空间中的对齐；不改变项目间距。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

/** align-content Key，控制整组内容沿块轴的分布。 */
export const $alignContent = key('align-content')

/** align-items Key，控制容器内子项沿块轴的对齐。 */
export const $alignItems = key('align-items')

/** align-self Key，为当前子项覆盖父容器的块轴对齐。 */
export const $alignSelf = key('align-self')

/** justify-content Key，控制整组内容沿行轴的分布。 */
export const $justifyContent = key('justify-content')

export const $justifyItems = key('justify-items')

export const $justifySelf = key('justify-self')

/** place-content Key，同时控制整组内容在行轴与块轴上的分布。 */
export const $placeContent = key('place-content')

/** place-items Key，同时控制容器内子项在行轴与块轴上的对齐。 */
export const $placeItems = key('place-items')

export const $placeSelf = key('place-self')

/** 布局对齐的 CSS 原名与具名 Key 对应表。 */
export const alignmentKeys = {
  'align-content': $alignContent,
  'align-items': $alignItems,
  'align-self': $alignSelf,
  'justify-content': $justifyContent,
  'justify-items': $justifyItems,
  'justify-self': $justifySelf,
  'place-content': $placeContent,
  'place-items': $placeItems,
  'place-self': $placeSelf,
}
