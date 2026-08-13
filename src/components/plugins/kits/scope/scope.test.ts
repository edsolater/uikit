import { describe, expect, test } from 'vitest'
import { usePlugin } from '../../usePlugin'
import { createScopeCapability, scope } from './scope'

describe('scope controller', () => {
  test('无 options 时是全量 Scope', () => {
    const capability = createScopeCapability('sample')
    const [, controller] = usePlugin(scope)

    expect(controller.full).toBe(true)
    expect(controller.includes(capability)).toBe(true)
  })

  test('选择性 Scope 只命中声明的能力', () => {
    const included = createScopeCapability('included')
    const excluded = createScopeCapability('excluded')
    const [, controller] = usePlugin(scope, { capabilities: [included] })

    expect(controller.full).toBe(false)
    expect(controller.includes(included)).toBe(true)
    expect(controller.includes(excluded)).toBe(false)
  })
})
