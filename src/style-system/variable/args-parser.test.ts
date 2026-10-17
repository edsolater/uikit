/** Variable 参数简写的识别与统一配置验证。

检查两处简写独立组合、覆盖关系及不应被识别为状态值的内容。

防止参数解析改变内容身份或提前执行生产函数。
*/
import { expect, test, vi } from 'vitest'
import { parseVariableArgs } from './args-parser'
import * as variables from './index'

test('两处简写独立展开，完整配置保留其他字段', () => {
  const onActive = vi.fn()
  const options = { name: 'amount', onActive, compileWaveIndex: 2 }
  expect(parseVariableArgs(1, 'amount')).toMatchObject({ defaultValue: 1, priority: 0 })
  expect(parseVariableArgs(1, options)).toMatchObject({ onActive, compileWaveIndex: 2, defaultValue: 1, priority: 0 })
  expect(parseVariableArgs({ default: 1, hover: 2 }, 'amount')).toMatchObject({
    defaultValue: 1, priority: 0, states: { hover: 2 },
  })
  expect(parseVariableArgs({ default: 1, hover: 2 }, options)).toMatchObject({
    onActive, compileWaveIndex: 2, defaultValue: 1, priority: 0, states: { hover: 2 },
  })
})

test('显式 states 覆盖同名简写状态并保留双方其他状态，不修改输入', () => {
  const input = { default: 1, hover: 2, active: 3 }
  const options = { name: 'amount', states: { hover: undefined, focus: 4 } }
  expect(parseVariableArgs(input, options).states).toEqual({ hover: undefined, active: 3, focus: 4 })
  expect(input).toEqual({ default: 1, hover: 2, active: 3 })
  expect(options.states).toEqual({ hover: undefined, focus: 4 })
})

test('default 即使为 undefined 也识别', () => {
  expect(parseVariableArgs({ default: undefined, hover: 2 }, 'empty')).toMatchObject({
    defaultValue: undefined, priority: 0, states: { hover: 2 },
  })
})

test('无 default 的内容保留普通内容身份', () => {
  const content = { toCSSString: () => '1' }
  const config = parseVariableArgs(content, 'content')
  expect(config.defaultValue).toBe(content)
  expect(config.states).toBeUndefined()
})

test('字符串快捷名称统一为 Name，显式 Name 保留传入身份', () => {
  expect(typeof parseVariableArgs(1, 'explicit').name).not.toBe('string')
  expect(typeof parseVariableArgs(1, { name: 'configured' }).name).not.toBe('string')
  const name = variables.variableName('configured-name')
  expect(parseVariableArgs(1, { name }).name).toBe(name)
})

test('默认生产函数和状态回调解析后均保留原样，不在 parser 中执行', () => {
  const source = vi.fn(() => 1)
  const hover = vi.fn(() => 2)
  const config = parseVariableArgs({ default: source, hover }, 'lazy')
  expect(config.defaultValue).toBe(source)
  expect(config.states?.hover).toBe(hover)
  expect(source).not.toHaveBeenCalled()
  expect(hover).not.toHaveBeenCalled()
})
