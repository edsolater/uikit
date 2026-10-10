/**
 * 浏览器标题与 State 来源的同步验证。
 *
 * 检查动态标题输入、浏览器外部标题变化和作用域释放后的观察停止。
 *
 * 防止标题 hook 更换状态协议后丢失同步与清理行为。
 */
// @vitest-environment jsdom
import { render } from 'solid-js/web'
import { describe, expect, test } from 'vitest'
import { createState, val, type State } from '@/foundation'
import { derive } from '../stateUtils'
import { useDocumentTitle } from './useDocumentTitle'

describe('useDocumentTitle', () => {
  test('标题跟随 State 派生来源变化，空标题不覆盖当前标题', () => {
    const originalTitle = document.title
    const index = createState(0)
    const titles = ['初始标题', '更新标题', '']
    let currentTitle!: State<string>
    const host = document.createElement('div')
    const dispose = render(() => {
      currentTitle = useDocumentTitle(derive(index, value => titles[value]))
      return <span>{val(currentTitle)}</span>
    }, host)

    try {
      expect(document.title).toBe('初始标题')
      expect(host.textContent).toBe('初始标题')

      index.set(1)
      expect(document.title).toBe('更新标题')
      expect(val(currentTitle)).toBe('更新标题')
      expect(host.textContent).toBe('更新标题')

      index.set(2)
      expect(document.title).toBe('更新标题')
      expect(val(currentTitle)).toBe('更新标题')
    } finally {
      dispose()
      document.title = originalTitle
    }
  })

  test('外部浏览器标题变化更新返回的 State，释放后停止镜像', async () => {
    const originalTitle = document.title
    document.title = '挂载前标题'
    let currentTitle!: State<string>
    const host = document.createElement('div')
    const dispose = render(() => {
      currentTitle = useDocumentTitle()
      return <span>{val(currentTitle)}</span>
    }, host)

    try {
      expect(val(currentTitle)).toBe('挂载前标题')
      document.title = '外部标题'
      await Promise.resolve()
      expect(val(currentTitle)).toBe('外部标题')
      expect(host.textContent).toBe('外部标题')

      dispose()
      document.title = '释放后标题'
      await Promise.resolve()
      expect(val(currentTitle)).toBe('外部标题')
    } finally {
      dispose()
      document.title = originalTitle
    }
  })
})
