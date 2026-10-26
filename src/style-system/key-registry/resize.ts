/**
 * 用户缩放尺寸的属性目标。
 *
 * 控制用户可否拖动调整元素尺寸，不声明静态宽高。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $resize = key('resize')

/** 用户缩放尺寸的 CSS 原名与具名 Key 对应表。 */
export const resizeKeys = {
  resize: $resize,
}
