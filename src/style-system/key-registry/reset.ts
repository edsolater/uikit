/**
 * 声明重置的属性目标。
 *
 * 通过 all 重置整组声明，遵循其排除项。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $all = key('all')

/** 声明重置的 CSS 原名与具名 Key 对应表。 */
export const resetKeys = {
  'all': $all,
}
