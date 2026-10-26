/**
 * 计数状态的属性目标。
 *
 * 声明计数器的重置、赋值与递增，供列表及其他生成内容使用。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $counterIncrement = key('counter-increment')

export const $counterReset = key('counter-reset')

export const $counterSet = key('counter-set')

/** 计数状态的 CSS 原名与具名 Key 对应表。 */
export const counterKeys = {
  'counter-increment': $counterIncrement,
  'counter-reset': $counterReset,
  'counter-set': $counterSet,
}
