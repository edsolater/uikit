/**
 * 行边缘排版的属性目标。
 *
 * 控制首行缩进及标点悬挂，表达文本行在容器边缘的进出。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $hangingPunctuation = key('hanging-punctuation')

export const $textIndent = key('text-indent')

/** 行边缘排版的 CSS 原名与具名 Key 对应表。 */
export const textIndentKeys = {
  'hanging-punctuation': $hangingPunctuation,
  'text-indent': $textIndent,
}
