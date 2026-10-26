/**
 * 文字尺寸适配的属性目标。
 *
 * 控制文字随可用空间或设备阅读环境进行尺寸适配；不替代基础 font-size。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $textSizeAdjust = key('text-size-adjust')

export const $textFit = key('text-fit')

/** 文字尺寸适配的 CSS 原名与具名 Key 对应表。 */
export const textSizingKeys = {
  'text-size-adjust': $textSizeAdjust,
  'text-fit': $textFit,
}
