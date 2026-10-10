import { createRoot } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'
import { createState, val, type Source } from '@/foundation'
import { createVariantPropsParser } from './parseVariantProps'

describe('createVariantPropsParser', () => {
  test('没有自有转换表的分组不读取原型属性', () => {
    const parser = createVariantPropsParser([{ groupName: 'constructor', candidates: ['length'] }], { appearance: { undefined: 'outlined' } })
    const { details, variantShadowProps } = parser({ constructor: 'length' })
    expect(details.constructor).toBe('length')
    expect(variantShadowProps.htmlProps!['data-constructor']).toBe(details.constructor)
  })

  test('映射只转换 DOM Source，原始 undefined 与 effect 身份不变', () => {
    createRoot((dispose) => {
      const appearance = createState<'filled' | 'outlined' | 'plain' | undefined>()
      const mapping = { appearance: { undefined: 'outlined', plain: undefined } }
      Object.setPrototypeOf(mapping.appearance, { filled: 'outlined' })
      const effect = vi.fn(() => undefined)
      const parser = createVariantPropsParser([{ groupName: 'appearance', candidates: ['filled', 'outlined', 'plain'], effect }], mapping)
      const { details, variantShadowProps } = parser({ appearance })
      const mapped = variantShadowProps.htmlProps!['data-appearance'] as Source<string | undefined>
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
      let effectVariant: Source<string | undefined> | undefined
      const effect = vi.fn((selectedVariant: Source<string | undefined>) => {
        effectVariant = selectedVariant
        return { htmlProps: { 'data-effect-brand': selectedVariant } }
      })
      const parseProps = createVariantPropsParser([
        { groupName: 'size', candidates: ['small', 'large'], effect },
      ])

      const { details, variantShadowProps } = parseProps({ large })

      expect(effect).toHaveBeenCalledOnce()
      expect(effectVariant).toBe(details.size)
      expect(variantShadowProps.htmlProps!['data-size']).toBe(details.size)
      expect(Array.isArray(variantShadowProps)).toBe(false)
      expect(variantShadowProps.shadowProps).toHaveLength(1)
      expect(val(details.size)).toBeUndefined()

      large.set(true)
      expect(val(details.size)).toBe('large')
      expect(effect).toHaveBeenCalledOnce()

      dispose()
    })
  })
})
