/**
 * 子树渲染隔离的属性目标。
 *
 * 声明布局/绘制等隔离边界及子树是否需要参与渲染。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $contain = key('contain')

export const $contentVisibility = key('content-visibility')

/** 子树渲染隔离的 CSS 原名与具名 Key 对应表。 */
export const containmentKeys = {
  'contain': $contain,
  'content-visibility': $contentVisibility,
}
