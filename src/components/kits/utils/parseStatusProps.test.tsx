import { createRoot } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'
import { createState, val } from '@/foundation'
import { createStatusPropsParser } from './parseStatusProps'

describe('createStatusPropsParser', () => {
  test('外部声明拥有状态，未声明状态才接受内部修改', () => {
    createRoot((dispose) => {
      const loading = createState(false)
      const effect = vi.fn(({ disabled }) => ({
        htmlProps: { disabled },
      }))
      const parseProps = createStatusPropsParser({
        candidates: ['loading', 'disabled'],
        effect,
      })

      const { details, statusActions, statusShadowProps } = parseProps({ loading })

      expect(effect).toHaveBeenCalledOnce()
      expect(Array.isArray(statusShadowProps)).toBe(false)
      expect(statusShadowProps.shadowProps).toBeDefined()
      const statusAttribute = statusShadowProps.htmlProps!['data-status']
      expect(val(statusAttribute)).toBeUndefined()

      statusActions.setStatus('loading', true)
      expect(val(details.loading)).toBe(false)

      loading.set(true)
      expect(val(details.loading)).toBe(true)
      expect(val(statusActions.hasStatus('loading'))).toBe(true)
      expect(val(statusAttribute)).toBe('loading')

      statusActions.setStatus('disabled', true)
      expect(val(details.disabled)).toBe(true)
      expect(val(statusActions.hasStatus('disabled'))).toBe(true)
      expect(val(statusAttribute)).toBe('loading disabled')
      loading.set(false)
      expect(val(statusAttribute)).toBe('disabled')
      expect(effect).toHaveBeenCalledOnce()

      dispose()
    })
  })
})
