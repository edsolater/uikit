/** 验证引用保留公开对象身份，不把可读取对象误当作值来源。 */
import { createRoot, flush } from 'solid-js'
import { expect, test } from 'vitest'
import { createState, type State } from '@/foundation'
import { createRef } from './createRef'

test('引用可接收State对象并操作原对象，释放接收器后清除能力', () => {
  const scope = createRoot(dispose => {
    const source = createState(2)
    const [reference, receive] = createRef<State<number>>()
    return { source, reference, release: receive(source), dispose }
  })
  try {
    flush()
    expect(scope.reference.read!()).toBe(2)
    scope.reference.set!(3)
    flush()
    expect(scope.source.read()).toBe(3)
    expect(scope.reference.read!()).toBe(3)
    scope.release!()
    flush()
    expect(scope.reference.read).toBeUndefined()
    expect(scope.source.read()).toBe(3)
  } finally {
    scope.dispose()
  }
})
