/**
 * 首字下沉的属性目标。
 *
 * 定义段首字母的下沉与尺寸关系。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $initialLetter = key('initial-letter')

/** 首字下沉的 CSS 原名与具名 Key 对应表。 */
export const initialLetterKeys = {
  'initial-letter': $initialLetter,
}
