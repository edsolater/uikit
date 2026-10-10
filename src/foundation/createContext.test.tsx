/**
 * 组件树上下文的数据传递验证。
 *
 * 检查默认读取、嵌套提供者就近取值，以及离开内层子树后继续使用外层值。
 *
 * 防止上下文入口迁移后丢失组件树的作用范围。
 */
// @vitest-environment jsdom
import { render } from 'solid-js/web'
import { describe, expect, test } from 'vitest'
import { createContext, useContext } from './createContext'

describe('组件树上下文', () => {
  test('没有提供者时读取默认值，未指定默认值时读取 undefined', () => {
    const withDefault = createContext('默认数据', { name: '默认数据通道' })
    const withoutDefault = createContext<string>()
    const host = document.createElement('div')
    const dispose = render(() => {
      expect(useContext(withoutDefault)).toBeUndefined()
      return <span>{useContext(withDefault)}</span>
    }, host)

    try {
      expect(host.textContent).toBe('默认数据')
    } finally {
      dispose()
    }
  })

  test('嵌套子树读取最近提供者，外层兄弟不受内层提供者影响', () => {
    const context = createContext('默认数据')
    const host = document.createElement('div')
    /**
     * 将当前组件树的上下文值显示为文本。
     */
    function Consumer() {
      return <span>{useContext(context)}</span>
    }

    const dispose = render(() => (
      <context.Provider value="外层数据">
        <Consumer />
        <context.Provider value="内层数据">
          <Consumer />
        </context.Provider>
        <Consumer />
      </context.Provider>
    ), host)

    try {
      expect(Array.from(host.querySelectorAll('span'), element => element.textContent))
        .toEqual(['外层数据', '内层数据', '外层数据'])
    } finally {
      dispose()
    }
  })
})
