/**
 * 文字装饰线的属性目标。
 *
 * 组织装饰线、下划线位置、粗细与避让。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $textDecoration = key('text-decoration')

export const $textDecorationColor = key('text-decoration-color')

export const $textDecorationInset = key('text-decoration-inset')

export const $textDecorationLine = key('text-decoration-line')

export const $textDecorationSkipInk = key('text-decoration-skip-ink')

export const $textDecorationStyle = key('text-decoration-style')

export const $textDecorationThickness = key('text-decoration-thickness')

export const $textUnderlineOffset = key('text-underline-offset')

export const $textUnderlinePosition = key('text-underline-position')

/** 文字装饰线的 CSS 原名与具名 Key 对应表。 */
export const textDecorationKeys = {
  'text-decoration': $textDecoration,
  'text-decoration-color': $textDecorationColor,
  'text-decoration-inset': $textDecorationInset,
  'text-decoration-line': $textDecorationLine,
  'text-decoration-skip-ink': $textDecorationSkipInk,
  'text-decoration-style': $textDecorationStyle,
  'text-decoration-thickness': $textDecorationThickness,
  'text-underline-offset': $textUnderlineOffset,
  'text-underline-position': $textUnderlinePosition,
}
