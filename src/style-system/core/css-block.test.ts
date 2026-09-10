/** 验证统一表达的 slot 落点、可选依赖与激活传播。 */
import { expect, test, vi } from 'vitest'
import { cssBlock } from './css-block'
import { cssSelector } from './derive/css-selector'

test('未激活时多项 attach 立即更新内部表达，保持落点和顺序', () => {
  const active = vi.fn()
  const output = vi.fn(() => 'a')
  const first = cssBlock(output, { onActive: active })
  const parent = cssBlock(slot => `before(${slot})after`)
  expect(parent.attach()).toBe(parent)
  expect(parent.attach(first, cssBlock('b'))).toBe(parent)
  expect(output).not.toHaveBeenCalled()
  expect(active).not.toHaveBeenCalled()
  expect(String(parent)).toBe('before(a\nb)after')
  parent.attach(cssBlock('c'))
  expect(String(parent)).toBe('before(a\nb\nc)after')
})

test('激活后多项 attach 更新内部表达并接通每项，仍不提前求值', () => {
  const active = vi.fn()
  const output = vi.fn(() => 'a')
  const parent = cssBlock()
  parent.activate()
  parent.attach(cssBlock(output, { onActive: active }), cssBlock('b', { onActive: active }))
  expect(active).toHaveBeenCalledTimes(2)
  expect(output).not.toHaveBeenCalled()
  expect(String(parent)).toBe('a\nb')
})

test('共享内容修改被各使用处读取，局部 attach 只改变该组合', () => {
  const shared = cssBlock('a')
  const first = cssBlock().attach(shared)
  const second = cssBlock().attach(shared)
  shared.setValue('b')
  first.attach(cssBlock('c'), cssBlock('d'))
  expect(String(first)).toBe('b\nc\nd')
  expect(String(second)).toBe('b')
})

test('dependence 可省略，也可与 onActive 同时提供', () => {
  const active = vi.fn()
  const dependency = cssBlock('dependency', { onActive: active })
  const parent = cssBlock('content', { dependence: [dependency], onActive: active })
  parent.activate()
  expect(active).toHaveBeenCalledTimes(2)
  expect(String(parent)).toBe('content')
  expect(String(cssBlock('plain'))).toBe('plain')
})

test('slot 在指定位置展开，构建及连接不执行内容函数', () => {
  const content = vi.fn(slot => `before(${slot})after`)
  const block = cssBlock(content).attach(cssBlock('inside'))
  expect(content).not.toHaveBeenCalled()
  expect(String(block)).toBe('before(inside)after')
})

test('依赖只激活，不自动追加输出', () => {
  const active = vi.fn()
  const dependency = cssBlock('不应出现', { onActive: active })
  const block = cssBlock('2px', { dependence: [dependency] })
  block.activate()
  expect(active).toHaveBeenCalledTimes(1)
  expect(String(block)).toBe('2px')
})

test('Block 作为 content 保留对象引用及激活关系', () => {
  const active = vi.fn()
  const inner = cssBlock('2px', { onActive: active })
  const outer = cssBlock(inner)
  inner.setValue('4px')
  outer.activate()
  expect(active).toHaveBeenCalledTimes(1)
  expect(String(outer)).toBe('4px')
})

test('selector 只在 attach 后输出括号，不过滤空内容', () => {
  const selector = cssSelector('.example')
  expect(String(selector)).toBe('')
  selector.attach(cssBlock(''))
  expect(String(selector)).toBe('.example {  }')
})

test('同一片段可以组合到不同 selector，嵌套由表达决定', () => {
  const declaration = cssBlock('color: blue;')
  const hover = cssSelector('&:hover').attach(declaration)
  const first = cssSelector('.first').attach(hover)
  const second = cssSelector('.second').attach(declaration)
  expect(String(first)).toBe('.first { &:hover { color: blue; } }')
  expect(String(second)).toBe('.second { color: blue; }')
})
