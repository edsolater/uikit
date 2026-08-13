import { describe, expect, test } from 'vitest'
import { createPlugin } from './definePlugin'
import { usePlugin } from './usePlugin'

describe('usePlugin', () => {
  test('显式实例化 Plugin 并暴露对应 Controller', () => {
    const samplePlugin = createPlugin<{ initialValue: number }, { value: number }>((options) => ({
      plugin: () => undefined,
      controller: { value: options?.initialValue ?? 0 },
    }))

    const [firstPlugin, firstController] = usePlugin(samplePlugin, { initialValue: 1 })
    const [secondPlugin, secondController] = usePlugin(samplePlugin, { initialValue: 2 })

    expect(firstPlugin).not.toBe(secondPlugin)
    expect(firstController).not.toBe(secondController)
    expect(firstController.value).toBe(1)
    expect(secondController.value).toBe(2)
  })
})
