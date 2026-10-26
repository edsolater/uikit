/**
 * CSS mobile-text-size-adjustment 模块的属性目标。
 *
 * 定义具名 Key 及 CSS 原名对应表。
 *
 * 让字符串与具名声明共用同一属性身份。
 */
import { key } from '@/style-system/key-definition'

// --- text 属性族 ---

export const $textSizeAdjust = key('text-size-adjust')

/** mobile-text-size-adjustment 模块的 CSS 原名与具名 Key 对应表。 */
export const mobileTextSizeAdjustmentKeys = {
  'text-size-adjust': $textSizeAdjust,
}
