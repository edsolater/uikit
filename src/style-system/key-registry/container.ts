/**
 * 查询容器声明的属性目标。
 *
 * 确定哪些元素充当什么查询容器及其名称；不实现条件规则本身。
 *
 * 让同一用途的声明在一处查找与维护。
 */
import { key } from '@/style-system/key-definition'

export const $container = key('container')

export const $containerName = key('container-name')

export const $containerType = key('container-type')

/** 查询容器声明的 CSS 原名与具名 Key 对应表。 */
export const containerKeys = {
  'container': $container,
  'container-name': $containerName,
  'container-type': $containerType,
}
