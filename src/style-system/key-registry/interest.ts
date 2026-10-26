/**
 * 兴趣触发时序的属性目标。
 *
 * 规定兴趣触发进入和退出的延迟。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $interestDelay = key('interest-delay')

export const $interestDelayEnd = key('interest-delay-end')

export const $interestDelayStart = key('interest-delay-start')

/** 兴趣触发时序的 CSS 原名与具名 Key 对应表。 */
export const interestKeys = {
  'interest-delay': $interestDelay,
  'interest-delay-end': $interestDelayEnd,
  'interest-delay-start': $interestDelayStart,
}
