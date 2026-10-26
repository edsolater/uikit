/**
 * 无当前规范模块归属的属性目标。
 *
 * 定义具名 Key 及 CSS 原名对应表。
 *
 * 让字符串与具名声明共用同一属性身份。
 */
import { key } from '@/style-system/key-definition'

// --- box 属性族 ---

export const $boxAlign = key('box-align')

export const $boxDirection = key('box-direction')

export const $boxFlex = key('box-flex')

export const $boxFlexGroup = key('box-flex-group')

export const $boxLines = key('box-lines')

export const $boxOrdinalGroup = key('box-ordinal-group')

export const $boxOrient = key('box-orient')

export const $boxPack = key('box-pack')

// --- user-modify 属性族 ---

export const $userModify = key('user-modify')

/** non-standard 模块的 CSS 原名与具名 Key 对应表。 */
export const nonStandardKeys = {
  'box-align': $boxAlign,
  'box-direction': $boxDirection,
  'box-flex': $boxFlex,
  'box-flex-group': $boxFlexGroup,
  'box-lines': $boxLines,
  'box-ordinal-group': $boxOrdinalGroup,
  'box-orient': $boxOrient,
  'box-pack': $boxPack,
  'user-modify': $userModify,
}
