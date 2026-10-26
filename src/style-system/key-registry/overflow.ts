/**
 * 盒内溢出的属性目标。
 *
 * 控制各方向溢出的裁剪和滚动容器形成；不包含文字截断与滚动导航。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $overflow = key('overflow')

export const $overflowBlock = key('overflow-block')

export const $overflowClipMargin = key('overflow-clip-margin')

export const $overflowInline = key('overflow-inline')

export const $overflowX = key('overflow-x')

export const $overflowY = key('overflow-y')

/** 盒内溢出的 CSS 原名与具名 Key 对应表。 */
export const overflowKeys = {
  'overflow': $overflow,
  'overflow-block': $overflowBlock,
  'overflow-clip-margin': $overflowClipMargin,
  'overflow-inline': $overflowInline,
  'overflow-x': $overflowX,
  'overflow-y': $overflowY,
}
