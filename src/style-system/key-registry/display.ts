/**
 * 布局盒生成的属性目标。
 *
 * 决定是否生成布局盒以及采用哪种格式化模式。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

/** display Key，选择元素的内部布局类型及外部显示角色。 */
export const $display = key('display')

/** 布局盒生成的 CSS 原名与具名 Key 对应表。 */
export const displayKeys = {
  display: $display,
}
