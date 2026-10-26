/**
 * 叠放顺序的属性目标。
 *
 * 管理 z-index 与顶层过渡中的 overlay 叠放控制；不定义混色。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $overlay = key('overlay')

export const $zIndex = key('z-index')

/** 叠放顺序的 CSS 原名与具名 Key 对应表。 */
export const stackingKeys = {
  'overlay': $overlay,
  'z-index': $zIndex,
}
