/**
 * 旁注排版的属性目标。
 *
 * 控制旁注的对齐、位置和越界方式。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $rubyAlign = key('ruby-align')

export const $rubyOverhang = key('ruby-overhang')

export const $rubyPosition = key('ruby-position')

/** 旁注排版的 CSS 原名与具名 Key 对应表。 */
export const rubyKeys = {
  'ruby-align': $rubyAlign,
  'ruby-overhang': $rubyOverhang,
  'ruby-position': $rubyPosition,
}
