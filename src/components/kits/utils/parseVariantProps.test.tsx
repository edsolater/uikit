import { createRoot, flush } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'
import { createState, val, type Source } from '@/foundation'
import { createVariantPropsParser } from './parseVariantProps'

describe('createVariantPropsParser', () => {
  test('建立字段派生时只读取业务 getter 一次，并跟随 Source 替换', () => {
    let reads = 0
    const { selected, second, details, dispose } = createRoot((dispose) => {
      const first = createState<'filled' | 'plain'>('filled')
      const second = createState<'filled' | 'plain'>('plain')
      const selected = createState({ source: first })
      const props = {
        get appearance() {
          reads++
          return val(selected).source
        },
      }
      const parser = createVariantPropsParser([
        { groupName: 'appearance', candidates: ['filled', 'plain'] },
      ])
      const { details } = parser(props)
      // 当前 Solid 的计算 Source 在建立时运行，字段的首次认领来自真正的选值计算。
      expect(reads).toBe(1)
      return { selected, second, details, dispose }
    })
    try {
      expect(val(details.appearance)).toBe('filled')
      selected.set({ source: second })
      flush()
      expect(val(details.appearance)).toBe('plain')
    } finally {
      dispose()
    }
  })

  test('已声明的不定字段 getter 持续更新，effect 持有稳定的结果 Source', () => {
    const { appearance, effect, details, variantEffectProps, dispose } =
      createRoot((dispose) => {
        const appearance = createState<'filled' | 'plain' | undefined>('filled')
        const effect = vi.fn(() => undefined)
        const parser = createVariantPropsParser([
          { groupName: 'appearance', candidates: ['filled', 'plain'], effect },
        ])
        const { effect: variantEffectProps, details } = parser({
          get appearance() {
            return val(appearance)
          },
        })
        return { appearance, effect, details, variantEffectProps, dispose }
      })
    try {
      expect(val(details.appearance)).toBe('filled')
      appearance.set('plain')
      flush()
      expect(val(details.appearance)).toBe('plain')
      expect(val(variantEffectProps[0].htmlProps!['data-appearance'])).toBe(
        'plain',
      )
      expect(effect).toHaveBeenCalledExactlyOnceWith(details.appearance)
      appearance.set(undefined)
      flush()
      expect(val(details.appearance)).toBeUndefined()
    } finally {
      dispose()
    }
  })

  test('没有自有转换表的分组不读取原型属性', () => {
    const parser = createVariantPropsParser(
      [{ groupName: 'constructor', candidates: ['length'] }],
      {
        appearance: { undefined: 'outlined' },
      },
    )
    const { effect: variantEffectProps, details } = parser({
      constructor: 'length',
    })
    expect(val(details.constructor)).toBe('length')
    expect(variantEffectProps[0].htmlProps!['data-constructor']).toBe(
      details.constructor,
    )
  })

  test('映射只转换 DOM Source，effect 保留稳定的原始选择 Source', () => {
    const { appearance, mapping, effect, details, mapped, dispose } =
      createRoot((dispose) => {
        const appearance = createState<
          'filled' | 'outlined' | 'plain' | undefined
        >()
        const mapping = {
          appearance: { undefined: 'outlined', plain: undefined },
        }
        Object.setPrototypeOf(mapping.appearance, { filled: 'outlined' })
        const effect = vi.fn(() => undefined)
        const parser = createVariantPropsParser(
          [
            {
              groupName: 'appearance',
              candidates: ['filled', 'outlined', 'plain'],
              effect,
            },
          ],
          mapping,
        )
        const { effect: variantEffectProps, details } = parser({ appearance })
        const mapped = variantEffectProps[0].htmlProps![
          'data-appearance'
        ] as Source<string | undefined>
        return { appearance, mapping, effect, details, mapped, dispose }
      })
    try {
      expect(val(details.appearance)).toBeUndefined()
      expect(effect).toHaveBeenCalledExactlyOnceWith(details.appearance)
      expect(val(mapped)).toBe('outlined')
      appearance.set('filled')
      flush()
      expect(val(mapped)).toBe('filled')
      appearance.set('plain')
      flush()
      expect(val(details.appearance)).toBe('plain')
      expect(val(mapped)).toBeUndefined()
      mapping.appearance.undefined = 'filled'
      appearance.set(undefined)
      flush()
      expect(val(mapped)).toBe('filled')
      expect(effect).toHaveBeenCalledOnce()
    } finally {
      dispose()
    }
  })

  test('effect 只运行一次，后续变化由同一个选中结果 Source 承载', () => {
    const {
      large,
      effectVariant,
      effect,
      details,
      variantEffectProps,
      dispose,
    } = createRoot((dispose) => {
      const large = createState(false)
      let effectVariant: Source<string | undefined> | undefined
      const effect = vi.fn((selectedVariant: Source<string | undefined>) => {
        effectVariant = selectedVariant
        return { htmlProps: { 'data-effect-brand': selectedVariant } }
      })
      const parseProps = createVariantPropsParser([
        { groupName: 'size', candidates: ['small', 'large'], effect },
      ])

      const { effect: variantEffectProps, details } = parseProps({ large })

      return {
        large,
        effectVariant,
        effect,
        details,
        variantEffectProps,
        dispose,
      }
    })
    try {
      expect(effect).toHaveBeenCalledOnce()
      expect(effectVariant).toBe(details.size)
      expect(variantEffectProps).toHaveLength(2)
      expect(variantEffectProps[0].htmlProps!['data-effect-brand']).toBe(
        details.size,
      )
      expect(variantEffectProps[1].htmlProps!['data-size']).toBe(details.size)
      expect(
        variantEffectProps.every((props) => !('shadowProps' in props)),
      ).toBe(true)
      expect(val(details.size)).toBeUndefined()

      large.set(true)
      flush()
      expect(val(details.size)).toBe('large')
      expect(effect).toHaveBeenCalledOnce()
    } finally {
      dispose()
    }
  })
})
