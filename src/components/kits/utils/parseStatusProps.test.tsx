import { createRoot, flush } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'
import { createState, val } from '@/foundation'
import { createStatusPropsParser } from './parseStatusProps'

describe('createStatusPropsParser', () => {
  test('带前缀的候选保留原名，外部 getter 持续更新且不被内部操作接管', () => {
    const { isLoading, details, statusController, attribute, dispose } =
      createRoot((dispose) => {
        const isLoading = createState(true)
        const parser = createStatusPropsParser({ candidates: ['isLoading'] })
        const { details, statusController, statusShadowProps } = parser({
          get isLoading() {
            return val(isLoading)
          },
        })
        const attribute = statusShadowProps.htmlProps!['data-status']
        return { isLoading, details, statusController, attribute, dispose }
      })
    try {
      expect(val(details.isLoading)).toBe(true)
      expect(val(statusController.isLoading)).toBe(true)
      expect(val(attribute)).toBe('isLoading')
      isLoading.set(false)
      flush()
      expect(val(details.isLoading)).toBe(false)
      expect(val(statusController.isLoading)).toBe(false)
      expect(val(attribute)).toBeUndefined()
      statusController.setStatus('isLoading', true)
      flush()
      expect(val(details.isLoading)).toBe(false)
      expect(val(statusController.isLoading)).toBe(false)
    } finally {
      dispose()
    }
  })

  test('外部声明拥有状态，未声明状态才接受内部修改', () => {
    const {
      loading,
      effect,
      details,
      statusController,
      statusShadowProps,
      dispose,
    } = createRoot((dispose) => {
      const loading = createState(false)
      const effect = vi.fn(({ disabled }) => ({
        htmlProps: { disabled },
      }))
      const parseProps = createStatusPropsParser({
        candidates: ['loading', 'disabled'],
        effect,
      })

      const { details, statusController, statusShadowProps } = parseProps({
        loading,
      })

      return {
        loading,
        effect,
        details,
        statusController,
        statusShadowProps,
        dispose,
      }
    })
    try {
      expect(effect).toHaveBeenCalledOnce()
      expect(Array.isArray(statusShadowProps)).toBe(false)
      expect(statusShadowProps.shadowProps).toBeDefined()
      const statusAttribute = statusShadowProps.htmlProps!['data-status']
      expect(val(statusAttribute)).toBeUndefined()
      expect(val(statusController.loading)).toBe(false)

      statusController.setStatus('loading', true)
      expect(val(details.loading)).toBe(false)

      loading.set(true)
      flush()
      expect(val(details.loading)).toBe(true)
      expect(val(statusController.hasStatus('loading'))).toBe(true)
      expect(val(statusController.loading)).toBe(true)
      expect(val(statusAttribute)).toBe('loading')

      statusController.setStatus('disabled', true)
      flush()
      expect(val(details.disabled)).toBe(true)
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
