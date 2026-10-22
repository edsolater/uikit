// @vitest-environment jsdom

import { createRoot } from 'solid-js'
import { render } from '@solidjs/web'
import { describe, expect, test } from 'vitest'
import { createContext, useContext } from '@/foundation'

describe('原生组件树上下文入口', () => {
  test('缺少提供者时使用明确默认值，未指定默认值则抛错', () => {
    const WithDefault = createContext('默认数据', { name: '默认数据通道' })
    const Required = createContext<string>()
    createRoot(dispose => {
      try {
        expect(useContext(WithDefault)).toBe('默认数据')
        expect(() => useContext(Required)).toThrow()
      } finally { dispose() }
    })
    expect(() => useContext(WithDefault)).toThrow()
  })

  test('嵌套子树读取最近提供者，外层兄弟不受内层提供者影响', () => {
    const Context = createContext('默认数据')
    const host = document.createElement('div')
    function Consumer() {
      return <span>{useContext(Context)}</span>
    }
    const dispose = render(() => (
      <Context value="外层数据">
        <Consumer />
        <Context value="内层数据"><Consumer /></Context>
        <Consumer />
      </Context>
    ), host)
    try {
      expect(Array.from(host.querySelectorAll('span'), element => element.textContent))
        .toEqual(['外层数据', '内层数据', '外层数据'])
    } finally { dispose() }
  })
})
