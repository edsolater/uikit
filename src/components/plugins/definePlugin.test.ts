import { describe, expect, test } from 'vitest'
import { createPlugin, createPluginInstanceSymbol } from './definePlugin'

describe('Plugin 定义', () => {
  test('Plugin 本体和传入 options 后的返回值都保留实例协议', () => {
    const samplePlugin = createPlugin<{ label: string }, { label: string }>((options) => ({
      plugin: () => undefined,
      controller: { label: options?.label ?? 'default' },
    }))

    const defaultInstance = samplePlugin[createPluginInstanceSymbol]()
    const configuredInstance = samplePlugin({ label: 'configured' })[createPluginInstanceSymbol]()

    expect(defaultInstance.controller.label).toBe('default')
    expect(configuredInstance.controller.label).toBe('configured')
  })
})
