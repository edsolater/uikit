/**
 * 整元素合成的属性目标。
 *
 * 控制整体透明度、与下层的混合及混合隔离；不处理背景内部各层混合。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

/** opacity Key；内容与背景的不透明度一起变化。 */
export const $opacity = key('opacity')

export const $isolation = key('isolation')

export const $mixBlendMode = key('mix-blend-mode')

/** 整元素合成的 CSS 原名与具名 Key 对应表。 */
export const compositingKeys = {
  'opacity': $opacity,
  'isolation': $isolation,
  'mix-blend-mode': $mixBlendMode,
}
