/** 验证引用保留公开对象身份，不把可读取对象误当作值来源。 */
import { createRoot, flush } from 'solid-js'
import { expect, test } from 'vitest'
import { createState, type State, val } from '@/foundation'
import { createRef } from './createRef'

test('引用保留控制器上的 State 字段身份', () => {
  const scope = createRoot(dispose => {
    const count = createState(2)
    const [reference, receive] = createRef<{ count: State<number> }>()
    receive({ count })
    return { count, reference, dispose }
  })
  try {
    flush()
    expect(scope.reference.count).toBe(scope.count)
  } finally {
    scope.dispose()
  }
})

test('引用可接收State对象并操作原对象，释放接收器后清除能力', () => {
  const scope = createRoot(dispose => {
    const source = createState(2)
    const [reference, receive] = createRef<State<number>>()
    return { source, reference, release: receive(source), dispose }
  })
  try {
    flush()
    expect(scope.reference._read!()).toBe(2)
    scope.reference.set!(3)
    flush()
    expect(val(scope.source)).toBe(3)
    expect(scope.reference._read!()).toBe(3)
    scope.release!()
    flush()
    expect(scope.reference._read).toBeUndefined()
    expect(val(scope.source)).toBe(3)
  } finally {
    scope.dispose()
  }
})
