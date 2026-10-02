import { createRoot } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'
import { createState, val, type Source } from '../../../hooks'
import { createBrandPropsParser } from './parseBrandProps'

describe('createBrandPropsParser', () => {
  test('没有自有转换表的分组不读取原型属性', () => {
    const parser = createBrandPropsParser([{ groupName: 'constructor', candidates: ['length'] }], { appearance: { undefined: 'outlined' } })
    const { details, brandShadowProps } = parser({ constructor: 'length' })
    expect(details.constructor).toBe('length')
    expect(brandShadowProps.htmlProps!['data-constructor']).toBe(details.constructor)
  })

  test('映射只转换 DOM Source，原始 undefined 与 effect 身份不变', () => {
    createRoot((dispose) => {
      const appearance = createState<'filled' | 'outlined' | 'plain' | undefined>()
      const mapping = { appearance: { undefined: 'outlined', plain: undefined } }
      Object.setPrototypeOf(mapping.appearance, { filled: 'outlined' })
      const effect = vi.fn(() => undefined)
      const parser = createBrandPropsParser([{ groupName: 'appearance', candidates: ['filled', 'outlined', 'plain'], effect }], mapping)
      const { details, brandShadowProps } = parser({ appearance })
      const mapped = brandShadowProps.htmlProps!['data-appearance'] as Source<string | undefined>
      expect(details.appearance).toBe(appearance)
      expect(val(details.appearance)).toBeUndefined()
      expect(effect).toHaveBeenCalledExactlyOnceWith(appearance)
      expect(val(mapped)).toBe('outlined')
      appearance.set('filled')
      expect(val(mapped)).toBe('filled')
      appearance.set('plain')
      expect(val(details.appearance)).toBe('plain')
      expect(val(mapped)).toBeUndefined()
      mapping.appearance.undefined = 'filled'
      appearance.set(undefined)
      expect(val(mapped)).toBe('filled')
      expect(effect).toHaveBeenCalledOnce()
      dispose()
    })
  })

  test('effect 只运行一次，后续变化由同一个选中结果 Source 承载', () => {
    createRoot((dispose) => {
      const large = createState(false)
      let effectBrand: Source<string | undefined> | undefined
      const effect = vi.fn((selectedBrand: Source<string | undefined>) => {
        effectBrand = selectedBrand
        return { htmlProps: { 'data-effect-brand': selectedBrand } }
      })
      const parseProps = createBrandPropsParser([
        { groupName: 'size', candidates: ['small', 'large'], effect },
      ])

      const { details, brandShadowProps } = parseProps({ large })

      expect(effect).toHaveBeenCalledOnce()
      expect(effectBrand).toBe(details.size)
      expect(brandShadowProps.htmlProps!['data-size']).toBe(details.size)
      expect(Array.isArray(brandShadowProps)).toBe(false)
      expect(brandShadowProps.shadowProps).toHaveLength(1)
      expect(val(details.size)).toBeUndefined()

      large.set(true)
      expect(val(details.size)).toBe('large')
      expect(effect).toHaveBeenCalledOnce()

      dispose()
    })
  })
})
