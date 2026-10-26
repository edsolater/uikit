/**
 * 文字选择的属性目标。
 *
 * 控制用户能否及怎样选择文字。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

/** user-select Key，描述元素文本能否被用户选中。 */
export const $userSelect = key('user-select')

/** 文字选择的 CSS 原名与具名 Key 对应表。 */
export const selectionKeys = {
  'user-select': $userSelect,
}
