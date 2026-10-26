/**
 * 滚动位置稳定的属性目标。
 *
 * 控制内容变化时是否通过滚动锚定维持视觉位置。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $overflowAnchor = key('overflow-anchor')

/** 滚动位置稳定的 CSS 原名与具名 Key 对应表。 */
export const scrollAnchorKeys = {
  'overflow-anchor': $overflowAnchor,
}
