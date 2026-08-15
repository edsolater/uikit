import { createRoot } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'
import { createState, val, type Source } from '../../../hooks'
import { createBrandPropsParser } from './parseBrandProps'

describe('createBrandPropsParser', () => {
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
