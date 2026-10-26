/**
 * 可见性的属性目标。
 *
 * 控制已有布局盒是否可见，保留 visibility 自身的布局/折叠语义。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $visibility = key('visibility')

/** 可见性的 CSS 原名与具名 Key 对应表。 */
export const visibilityKeys = {
  visibility: $visibility,
}
