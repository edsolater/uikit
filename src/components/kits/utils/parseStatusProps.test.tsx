import { createRoot, flush } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'
import { createState, val } from '@/foundation'
import { createStatusPropsParser } from './parseStatusProps'

describe('createStatusPropsParser', () => {
  test('已声明的外部 getter 字段持续更新，内部操作不接管它', () => {
    const { disabled, details, statusActions, attribute, dispose } = createRoot(
      (dispose) => {
        const disabled = createState(true)
        const parser = createStatusPropsParser({ candidates: ['disabled'] })
        const { details, statusActions, statusShadowProps } = parser({
          get disabled() {
            return val(disabled)
          },
        })
        const attribute = statusShadowProps.htmlProps!['data-status']
        return { disabled, details, statusActions, attribute, dispose }
      },
    )
    try {
      expect(val(details.disabled)).toBe(true)
      expect(val(attribute)).toBe('disabled')
      disabled.set(false)
      flush()
      expect(val(details.disabled)).toBe(false)
      expect(val(attribute)).toBeUndefined()
      statusActions.setStatus('disabled', true)
      flush()
      expect(val(details.disabled)).toBe(false)
    } finally {
      dispose()
    }
  })

  test('外部声明拥有状态，未声明状态才接受内部修改', () => {
    const {
      loading,
      effect,
      details,
      statusActions,
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

      const { details, statusActions, statusShadowProps } = parseProps({
        loading,
      })

      return {
        loading,
        effect,
        details,
        statusActions,
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

      statusActions.setStatus('loading', true)
      expect(val(details.loading)).toBe(false)

      loading.set(true)
      flush()
      expect(val(details.loading)).toBe(true)
      expect(val(statusActions.hasStatus('loading'))).toBe(true)
      expect(val(statusAttribute)).toBe('loading')

      statusActions.setStatus('disabled', true)
      flush()
      expect(val(details.disabled)).toBe(true)
      expect(val(statusActions.hasStatus('disabled'))).toBe(true)
      expect(val(statusAttribute)).toBe('loading disabled')
      loading.set(false)
      flush()
      expect(val(statusAttribute)).toBe('disabled')
      expect(effect).toHaveBeenCalledOnce()
    } finally {
      dispose()
    }
  })
})
