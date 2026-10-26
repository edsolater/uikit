/**
 * 生成内容的属性目标。
 *
 * 声明生成内容及引号配对，不拥有计数器的状态更新。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $content = key('content')

export const $quotes = key('quotes')

/** 生成内容的 CSS 原名与具名 Key 对应表。 */
export const contentKeys = {
  content: $content,
  quotes: $quotes,
}
