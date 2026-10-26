/**
 * 指针命中的属性目标。
 *
 * 控制指针事件能否命中元素。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $pointerEvents = key('pointer-events')

/** 指针命中的 CSS 原名与具名 Key 对应表。 */
export const hitTestingKeys = {
  'pointer-events': $pointerEvents,
}
