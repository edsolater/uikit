/**
 * 区分不同对象目的的标记，标记对象的性质。
 * 
 * 如要添加新标记，需想明白多个的可组合性是不是在同一层次
 *
 * raw 是不可分割的业务实体。
 *
 * 本文件意图提供一系列raw系列与collection系列的区分工具
 */
import { attachBrand, createBrand, hasBrand } from './brand'
import type { BrandValue } from './brand'

/**
 * [标记]
 * 标记一个对象是一个原始的业务实体
 *
 * 判定器：{@link isRaw}
 * @example
 * ```ts
 * const person = {
 *   name: 'Alice',
 *   age: 23,
 *   [rawBrand]: true
 * }
 * ```
 */
export const rawBrand = createBrand('raw')

/**
 * 判断一个值是否是一个被标记为 raw 的对象。
 */
export function isRaw(value: unknown): value is BrandValue<typeof rawBrand> {
  return hasBrand(value, rawBrand)
}

/**
 * 【可变工具函数】  把一个对象标记为 raw。
 * @example
 * 
 */
export function markRaw<T extends object>(obj: T): T & BrandValue<typeof rawBrand> {
  return attachBrand(obj, rawBrand)
}

