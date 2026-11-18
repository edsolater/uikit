import { createRoot, flush } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'
import { createState, val } from '@/foundation'
import { createStatusPropsParser } from './parseStatusProps'

describe('createStatusPropsParser', () => {
  test('创建时的外部状态即使显式为空并在之后撤去，也不交给内部控制', () => {
    const props: { loading?: boolean } = { loading: undefined }
    createRoot(dispose => {
      try {
        const parseProps = createStatusPropsParser({ candidates: ['loading'] })
        const { controller } = parseProps(props)
        delete props.loading
        controller.setStatus('loading', true)
        flush()
        expect(val(controller.loading)).toBe(false)
      } finally {
        dispose()
      }
    })
  })

  test('状态计算自然取得字段，创建阶段不额外读取并丢弃 getter', () => {
    let reads = 0
    createRoot(dispose => {
      const parser = createStatusPropsParser({ candidates: ['loading'] })
      const { statusSources } = parser({
        get loading() {
          reads++
          return true
        },
      })
      expect(reads).toBe(1)
      expect(val(statusSources.loading)).toBe(true)
      expect(reads).toBe(1)
      dispose()
    })
  })

  test('带前缀的候选保留原名，外部 getter 持续更新且不被内部操作接管', () => {
    const { isLoading, statusSources, statusController, attribute, dispose } =
      createRoot(dispose => {
        const isLoading = createState(true)
        const parser = createStatusPropsParser({ candidates: ['isLoading'] })
        const {
          effectResult: statusEffectResultProps,
          statusSources,
          controller: statusController,
        } = parser({
          get isLoading() {
            return val(isLoading)
          },
        })
        const attribute = statusEffectResultProps[0].htmlProps!['data-status']
        return {
          isLoading,
          statusSources,
          statusController,
          attribute,
          dispose,
        }
      })
    try {
      expect(val(statusSources.isLoading)).toBe(true)
      expect(val(statusController.isLoading)).toBe(true)
      expect(val(attribute)).toBe('isLoading')
      isLoading.set(false)
      flush()
      expect(val(statusSources.isLoading)).toBe(false)
      expect(val(statusController.isLoading)).toBe(false)
      expect(val(attribute)).toBeUndefined()
      statusController.setStatus('isLoading', true)
      flush()
      expect(val(statusSources.isLoading)).toBe(false)
      expect(val(statusController.isLoading)).toBe(false)
    } finally {
      dispose()
    }
  })

  test('外部声明拥有状态，未声明状态才接受内部修改', () => {
    const {
      loading,
      effect,
      statusSources,
      statusController,
      statusEffectResultProps,
      dispose,
    } = createRoot(dispose => {
      const loading = createState(false)
      const effect = vi.fn(({ disabled }) => ({
        htmlProps: { disabled, 'data-status': '被自动结果覆盖' },
      }))
      const parseProps = createStatusPropsParser({
        candidates: ['loading', 'disabled'],
        effect,
      })

      const {
        effectResult: statusEffectResultProps,
        statusSources,
        controller: statusController,
      } = parseProps({
        loading,
      })

      return {
        loading,
        effect,
        statusSources,
        statusController,
        statusEffectResultProps,
        dispose,
      }
    })
    try {
      expect(effect).toHaveBeenCalledOnce()
      expect(statusEffectResultProps).toHaveLength(2)
      expect(statusEffectResultProps[0]).toEqual({
        htmlProps: {
          'disabled': statusSources.disabled,
          'data-status': '被自动结果覆盖',
        },
      })
      expect(
        statusEffectResultProps.every(props => !('shadowProps' in props)),
      ).toBe(true)
      expect(statusEffectResultProps[0].htmlProps!['data-status']).toBe(
        '被自动结果覆盖',
      )
      const statusAttribute =
        statusEffectResultProps[1].htmlProps!['data-status']
      expect(val(statusAttribute)).toBeUndefined()
      expect(val(statusController.loading)).toBe(false)

      statusController.setStatus('loading', true)
      expect(val(statusSources.loading)).toBe(false)

      loading.set(true)
      flush()
      expect(val(statusSources.loading)).toBe(true)
      expect(val(statusController.hasStatus('loading'))).toBe(true)
      expect(val(statusController.loading)).toBe(true)
      expect(val(statusAttribute)).toBe('loading')

      statusController.setStatus('disabled', true)
      flush()
      expect(val(statusSources.disabled)).toBe(true)
      expect(val(statusController.hasStatus('disabled'))).toBe(true)
      expect(val(statusController.disabled)).toBe(true)
      expect(val(statusAttribute)).toBe('loading disabled')
      loading.set(false)
      flush()
      expect(val(statusAttribute)).toBe('disabled')
      expect(val(statusController.loading)).toBe(false)
      expect(effect).toHaveBeenCalledOnce()
    } finally {
      dispose()
    }
  })
})
