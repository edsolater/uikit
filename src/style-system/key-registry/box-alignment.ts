/**
 * CSS box-alignment 模块的属性目标。
 *
 * 定义具名 Key 及 CSS 原名对应表。
 *
 * 让字符串与具名声明共用同一属性身份。
 */
import { key } from '@/style-system/key-definition'

// --- align 属性族 ---

/** align-content Key，控制整组内容沿块轴的分布。 */
export const $alignContent = key('align-content')

/** align-items Key，控制容器内子项沿块轴的对齐。 */
export const $alignItems = key('align-items')

/** align-self Key，为当前子项覆盖父容器的块轴对齐。 */
export const $alignSelf = key('align-self')

// --- column 属性族 ---

export const $columnGap = key('column-gap')

// --- gap 属性族 ---

/** gap Key，设置子项之间的间距。 */
export const $gap = key('gap')

// --- justify 属性族 ---

/** justify-content Key，控制整组内容沿行轴的分布。 */
export const $justifyContent = key('justify-content')

export const $justifyItems = key('justify-items')

export const $justifySelf = key('justify-self')

// --- place 属性族 ---

/** place-content Key，同时控制整组内容在行轴与块轴上的分布。 */
export const $placeContent = key('place-content')

/** place-items Key，同时控制容器内子项在行轴与块轴上的对齐。 */
export const $placeItems = key('place-items')

export const $placeSelf = key('place-self')

// --- row 属性族 ---

export const $rowGap = key('row-gap')

/** box-alignment 模块的 CSS 原名与具名 Key 对应表。 */
export const boxAlignmentKeys = {
  'align-content': $alignContent,
  'align-items': $alignItems,
  'align-self': $alignSelf,
  'column-gap': $columnGap,
  'gap': $gap,
  'justify-content': $justifyContent,
  'justify-items': $justifyItems,
  'justify-self': $justifySelf,
  'place-content': $placeContent,
  'place-items': $placeItems,
  'place-self': $placeSelf,
  'row-gap': $rowGap,
}
