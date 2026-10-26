/**
 * CSS conditional-rules 模块的属性目标。
 *
 * 定义具名 Key 及 CSS 原名对应表。
 *
 * 让字符串与具名声明共用同一属性身份。
 */
import { key } from '@/style-system/key-definition'

// --- container 属性族 ---

export const $container = key('container')

export const $containerName = key('container-name')

export const $containerType = key('container-type')

/** conditional-rules 模块的 CSS 原名与具名 Key 对应表。 */
export const conditionalRulesKeys = {
  'container': $container,
  'container-name': $containerName,
  'container-type': $containerType,
}
