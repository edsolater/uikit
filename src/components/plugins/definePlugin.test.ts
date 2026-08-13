import { describe, expect, test } from 'vitest'
import { consumePlugin } from './consumePlugin'
import { createPlugin } from './definePlugin'

describe('Plugin 定义', () => {
  test('Plugin 本体和传入 options 后的返回值都能被 Consumer 消费', () => {
    const samplePlugin = createPlugin<{ label: string }, { label: string }>((options) => ({
      plugin: () => undefined,
      controller: { label: options?.label ?? 'default' },
    }))

    expect(consumePlugin(samplePlugin).controller.label).toBe('default')
    expect(consumePlugin(samplePlugin({ label: 'configured' })).controller.label).toBe('configured')
  })
})
