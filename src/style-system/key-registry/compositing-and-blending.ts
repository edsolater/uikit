/**
 * CSS compositing-and-blending 模块的属性目标。
 *
 * 定义具名 Key 及 CSS 原名对应表。
 *
 * 让字符串与具名声明共用同一属性身份。
 */
import { key } from '@/style-system/key-definition'

// --- isolation 属性族 ---

export const $isolation = key('isolation')

// --- mix-blend-mode 属性族 ---

export const $mixBlendMode = key('mix-blend-mode')

/** compositing-and-blending 模块的 CSS 原名与具名 Key 对应表。 */
export const compositingAndBlendingKeys = {
  'isolation': $isolation,
  'mix-blend-mode': $mixBlendMode,
}
