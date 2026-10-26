/**
 * 渲染准备提示的属性目标。
 *
 * 提示未来可能变化的属性，不与其他性能相关 Key 混成杂项。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $willChange = key('will-change')

/** 渲染准备提示的 CSS 原名与具名 Key 对应表。 */
export const willChangeKeys = {
  'will-change': $willChange,
}
