import { describe, expect, test } from 'vitest'

import { attachBrand, createBrand, hasBrand } from './brand'
import { isRaw, markRaw, rawBrand } from './brandRaw'

describe('brand', () => {
  test('createBrand 会创建稳定的 brand 元信息', () => {
    const brand = createBrand('sample')

    expect(brand.name).toBe('sample')
    expect(brand.type).toBe('brand')
    expect(typeof brand.symbol).toBe('symbol')
  })

  test('attachBrand 会把目标 brand 挂到对象上', () => {
    const payload = { name: 'Alice' }
    const brand = createBrand('entity')

    const brandedPayload = attachBrand(payload, brand)

    expect(brandedPayload).toBe(payload)
    expect(hasBrand(payload, brand)).toBe(true)
  })

  test('hasBrand 支持通过 excludeBrand 排除指定 brand', () => {
    const payload = {}
    const includedBrand = createBrand('included')
    const excludedBrand = createBrand('excluded')

    attachBrand(payload, includedBrand)
    attachBrand(payload, excludedBrand)

    expect(hasBrand(payload, includedBrand)).toBe(true)
    expect(hasBrand(payload, includedBrand, excludedBrand)).toBe(false)
  })
})

describe('raw', () => {
  test('markRaw 会把对象标记为 raw', () => {
    const person = { name: 'Alice' }

    const rawPerson = markRaw(person)

    expect(rawPerson).toBe(person)
    expect(isRaw(person)).toBe(true)
    expect(rawBrand.name).toBe('raw')
  })

  test('isRaw 对未标记的值返回 false', () => {
    expect(isRaw({ name: 'Alice' })).toBe(false)
    expect(isRaw(null)).toBe(false)
    expect(isRaw('raw')).toBe(false)
  })
})