/**
 * 分页上下文的属性目标。
 *
 * 选择命名页；不继续收录已废弃的 page-break 别名。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $page = key('page')

/** 分页上下文的 CSS 原名与具名 Key 对应表。 */
export const pageKeys = {
  page: $page,
}
