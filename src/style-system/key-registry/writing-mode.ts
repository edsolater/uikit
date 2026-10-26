/**
 * 书写方向的属性目标。
 *
 * 组织书写轴、双向文字与字形朝向的关联配置。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $direction = key('direction')

export const $textCombineUpright = key('text-combine-upright')

export const $textOrientation = key('text-orientation')

export const $unicodeBidi = key('unicode-bidi')

export const $writingMode = key('writing-mode')

/** 书写方向的 CSS 原名与具名 Key 对应表。 */
export const writingModeKeys = {
  'direction': $direction,
  'text-combine-upright': $textCombineUpright,
  'text-orientation': $textOrientation,
  'unicode-bidi': $unicodeBidi,
  'writing-mode': $writingMode,
}
