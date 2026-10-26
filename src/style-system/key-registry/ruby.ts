/**
 * CSS ruby 模块的属性目标。
 *
 * 定义具名 Key 及 CSS 原名对应表。
 *
 * 让字符串与具名声明共用同一属性身份。
 */
import { key } from '@/style-system/key-definition'

// --- ruby 属性族 ---

export const $rubyAlign = key('ruby-align')

export const $rubyOverhang = key('ruby-overhang')

export const $rubyPosition = key('ruby-position')

/** ruby 模块的 CSS 原名与具名 Key 对应表。 */
export const rubyKeys = {
  'ruby-align': $rubyAlign,
  'ruby-overhang': $rubyOverhang,
  'ruby-position': $rubyPosition,
}
