/**
 * 插入光标的属性目标。
 *
 * 控制文本插入光标的颜色、形态与闪烁；不把子属性支持当作 shorthand 已支持。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $caretAnimation = key('caret-animation')

export const $caretColor = key('caret-color')

export const $caretShape = key('caret-shape')

/** 插入光标的 CSS 原名与具名 Key 对应表。 */
export const caretKeys = {
  'caret-animation': $caretAnimation,
  'caret-color': $caretColor,
  'caret-shape': $caretShape,
}
