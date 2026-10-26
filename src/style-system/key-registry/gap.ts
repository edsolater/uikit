/**
 * 项目间距的属性目标。
 *
 * 定义布局项目之间的行/列间距；不绘制分隔线。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $columnGap = key('column-gap')

/** gap Key，设置子项之间的间距。 */
export const $gap = key('gap')

export const $rowGap = key('row-gap')

/** 项目间距的 CSS 原名与具名 Key 对应表。 */
export const gapKeys = {
  'column-gap': $columnGap,
  'gap': $gap,
  'row-gap': $rowGap,
}
