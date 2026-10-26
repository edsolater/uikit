/**
 * 分片装饰方式的属性目标。
 *
 * 决定一个盒子被拆成多个片段后，背景和外框怎样延续或逐片绘制；不决定断片位置。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $boxDecorationBreak = key('box-decoration-break')

/** 分片装饰方式的 CSS 原名与具名 Key 对应表。 */
export const decorationBreakKeys = {
  'box-decoration-break': $boxDecorationBreak,
}
