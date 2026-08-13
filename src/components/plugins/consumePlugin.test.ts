import { describe, expect, test } from 'vitest'
import { consumePlugin } from './consumePlugin'
import { createPlugin } from './definePlugin'

describe('Plugin Consumer', () => {
  test('消费 options 并为每次消费创建独立实例', () => {
    const samplePlugin = createPlugin<{ initialValue: number }, { value: number }>((options) => ({
      plugin: () => undefined,
      controller: { value: options?.initialValue ?? 0 },
    }))

    const firstInstance = consumePlugin(samplePlugin, { initialValue: 1 })
    const secondInstance = consumePlugin(samplePlugin, { initialValue: 2 })

    expect(firstInstance.plugin).not.toBe(secondInstance.plugin)
    expect(firstInstance.controller).not.toBe(secondInstance.controller)
    expect(firstInstance.controller.value).toBe(1)
    expect(secondInstance.controller.value).toBe(2)
  })

  test('不是 Plugin 的值不会被错误消费', () => {
    expect(consumePlugin(() => undefined)).toBeUndefined()
  })
})
