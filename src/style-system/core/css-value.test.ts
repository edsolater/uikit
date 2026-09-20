/** Value 稳定内容与输出协议。 */
import { expect, test, vi } from 'vitest'
import { value, cssContent } from './css-value'
import { variable } from './css-variable'
import { colorMix } from '../values/functions/color-mix'

test('Value 只保存内容和按需依赖', () => {
  const onActive = vi.fn()
  const content = value(0, { onActive })
  expect(content).toEqual({ kind: 'value', content: 0, onActive })
  expect('conditions' in content).toBe(false)
  if (false) {
    // @ts-expect-error Value 不再接受状态。
    value(1, { hover: 2 })
  }
})
test('混色对象有明确输出入口，直接调用保持同一输出', () => {
  const content = colorMix(['black', 0.5], 'white')
  const read = (input: unknown) => String(input)
  expect(content(read)).toBe(content.serializeCSS(read))
  expect(cssContent(() => 'red').serializeCSS(read)).toBe('red')
})
test('source 回调保持首参数类型和身份', () => {
  const source = value('red')
  const callback = vi.fn((received: typeof source) => received)
  variable(source, { name: 'test-color', states: { active: callback } })
  expect(callback).toHaveBeenCalledOnce()
  expect(callback).toHaveBeenCalledWith(source)
})
