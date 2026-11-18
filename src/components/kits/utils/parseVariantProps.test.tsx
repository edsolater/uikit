import { createRoot, flush } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'
import { createState, val, type Source } from '@/foundation'
import { createVariantPropsParser } from './parseVariantProps'

describe('createVariantPropsParser', () => {
  test('建立字段派生时只读取业务 getter 一次，并跟随 Source 替换', () => {
    let reads = 0
    const { selected, second, selectedVariants, dispose } = createRoot(
      dispose => {
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
        const { selectedVariants } = parser(props)
        // 当前 Solid 的计算 Source 在建立时运行，字段的首次认领来自真正的选值计算。
        expect(reads).toBe(1)
        return { selected, second, selectedVariants, dispose }
      },
    )
    try {
      expect(val(selectedVariants.appearance)).toBe('filled')
      selected.set({ source: second })
      flush()
      expect(val(selectedVariants.appearance)).toBe('plain')
    } finally {
      dispose()
    }
  })

  test('已声明的不定字段 getter 持续更新，effect 持有稳定的结果 Source', () => {
    const {
      appearance,
      effect,
      selectedVariants,
      variantEffectResultProps,
      dispose,
    } = createRoot(dispose => {
      const appearance = createState<'filled' | 'plain' | undefined>('filled')
      const effect = vi.fn(() => undefined)
      const parser = createVariantPropsParser([
        {
          groupName: 'appearance',
          candidates: ['filled', 'plain'],
          effect,
        },
      ])
      const { effectResult: variantEffectResultProps, selectedVariants } =
        parser({
          get appearance() {
            return val(appearance)
          },
        })
      return {
        appearance,
        effect,
        selectedVariants,
        variantEffectResultProps,
        dispose,
      }
    })
    try {
      expect(val(selectedVariants.appearance)).toBe('filled')
      appearance.set('plain')
      flush()
      expect(val(selectedVariants.appearance)).toBe('plain')
      expect(
        val(variantEffectResultProps[0].htmlProps!['data-appearance']),
      ).toBe('plain')
      expect(effect).toHaveBeenCalledExactlyOnceWith(
        selectedVariants.appearance,
      )
      appearance.set(undefined)
      flush()
      expect(val(selectedVariants.appearance)).toBeUndefined()
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
    const { effectResult: variantEffectResultProps, selectedVariants } = parser(
      {
        constructor: 'length',
      },
    )
    expect(val(selectedVariants.constructor)).toBe('length')
    expect(variantEffectResultProps[0].htmlProps!['data-constructor']).toBe(
      selectedVariants.constructor,
    )
  })

  test('映射只转换 DOM Source，effect 保留稳定的原始选择 Source', () => {
    const { appearance, mapping, effect, selectedVariants, mapped, dispose } =
      createRoot(dispose => {
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
        const { effectResult: variantEffectResultProps, selectedVariants } =
          parser({
            appearance,
          })
        const mapped = variantEffectResultProps[0].htmlProps![
          'data-appearance'
        ] as Source<string | undefined>
        return {
          appearance,
          mapping,
          effect,
          selectedVariants,
          mapped,
          dispose,
        }
      })
    try {
      expect(val(selectedVariants.appearance)).toBeUndefined()
      expect(effect).toHaveBeenCalledExactlyOnceWith(
        selectedVariants.appearance,
      )
      expect(val(mapped)).toBe('outlined')
      appearance.set('filled')
      flush()
      expect(val(mapped)).toBe('filled')
      appearance.set('plain')
      flush()
      expect(val(selectedVariants.appearance)).toBe('plain')
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
      receivedVariant,
      effect,
      selectedVariants,
      variantEffectResultProps,
      dispose,
    } = createRoot(dispose => {
      const large = createState(false)
      let receivedVariant: Source<string | undefined> | undefined
      const effect = vi.fn((selectedVariant: Source<string | undefined>) => {
        receivedVariant = selectedVariant
        return {
          htmlProps: {
            'data-generated-brand': selectedVariant,
            'data-size': '被自动结果覆盖',
          },
        }
      })
      const parseProps = createVariantPropsParser([
        {
          groupName: 'size',
          candidates: ['small', 'large'],
          effect,
        },
      ])

      const { effectResult: variantEffectResultProps, selectedVariants } =
        parseProps({
          large,
        })

      return {
        large,
        receivedVariant,
        effect,
        selectedVariants,
        variantEffectResultProps,
        dispose,
      }
    })
    try {
      expect(effect).toHaveBeenCalledOnce()
      expect(receivedVariant).toBe(selectedVariants.size)
      expect(variantEffectResultProps).toHaveLength(2)
      expect(
        variantEffectResultProps[0].htmlProps!['data-generated-brand'],
      ).toBe(selectedVariants.size)
      expect(variantEffectResultProps[0].htmlProps!['data-size']).toBe(
        '被自动结果覆盖',
      )
      expect(variantEffectResultProps[1].htmlProps!['data-size']).toBe(
        selectedVariants.size,
      )
      expect(
        variantEffectResultProps.every(props => !('shadowProps' in props)),
      ).toBe(true)
      expect(val(selectedVariants.size)).toBeUndefined()

      large.set(true)
      flush()
      expect(val(selectedVariants.size)).toBe('large')
      expect(effect).toHaveBeenCalledOnce()
    } finally {
      dispose()
    }
  })
})
