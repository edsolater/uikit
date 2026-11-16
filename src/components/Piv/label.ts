/** 实例名称的共同解释入口；列表与其中的 Source 在实际消费作用域读取。 */
import { isArray } from '@edsolater/fnkit'
import { val } from '@/foundation'
import type { PivProps } from './Piv'

/**
 * 空缺项不产生文字；已声明的空字符串保留为空名称，非空项以空格连接。
 * Source 和 Promise 沿当前消费作用域读取，等待及恢复仍由现有 Loading 边界负责。
 *
 * @example
 * resolvePivLabel(['筛选条件', undefined, '收货地址']) // '筛选条件 收货地址'
 * resolvePivLabel(['', undefined]) // ''
 */
export function resolvePivLabel(source: PivProps['label']): string | undefined {
  const value = val(source)
  const values = (isArray(value) ? value : [value]).map((item) => val(item))
  const labels = values.filter((item) => item !== undefined)
  return labels.length
    ? labels.filter((item) => item !== '').join(' ')
    : undefined
}
