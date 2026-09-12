/** 验证可调用 Block 的对象身份、显式派生及真实激活链。 */
import { expect, expectTypeOf, test, vi } from 'vitest'
import { block, isBlock, type Block } from './css-block'
import { selector } from './derive/css-selector'
import { value } from './derive/css-value'
import { property } from './derive/css-property'

test('对象直接可用，调用才派生；不存在 Factory 和 Instance 两套入口', () => {
  const original = selector('.first')
  const next = original()
  expect(isBlock(original)).toBe(true)
  expect(isBlock(next)).toBe(true)
  expect('create' in original).toBe(false)
  expect('setValue' in original).toBe(false)
  expect(next).not.toBe(original)
  expect(next).toBeInstanceOf(Function)
  expect(typeof next.call).toBe('function')
  expect(typeof next.bind).toBe('function')
  expect(next.attach).toBe(original.attach)
  expectTypeOf(next).toEqualTypeOf(original)
  expectTypeOf<typeof next>().toExtend<Block>()
})

test('反复派生以当前内容和连接为起点，修改独立属性不回写', () => {
  const blue = property('color', value('blue'))
  const original = selector('.original').attach(blue)
  original.selector = '.current'
  const next = original()
  next.selector = '.next'
  next.attach(property('opacity', value(0.5)))
  const last = next()
  last.selector = '.last'
  expect(original.selector).toBe('.current')
  expect(next.selector).toBe('.next')
  expect(last.children).toEqual(next.children)
  expect(last.children).not.toBe(next.children)
  expect(original.children).toEqual([blue])
  expect(last.children[0]).toBe(blue)
  original.selector = '.later'
  expect(last.parseCss()).toBe('.last { color: blue;\nopacity: 0.5; }')
})

test('attach 接受零个或多个对象，原样保存重复及共享引用', () => {
  const child = value('shared')
  const first = block()
  const second = block()
  expect(first.attach()).toBe(first)
  expect(first.attach(child, child)).toBe(first)
  second.attach(child)
  expect(first.children[0]).toBe(child)
  expect(first.children[1]).toBe(child)
  expect(second.children[0]).toBe(child)
  expect('parent' in child).toBe(false)
  expect('index' in child).toBe(false)
})

test('派生复制连接集合，不暗中派生子对象；隔离子级也由业务显式选择', () => {
  const child = block().attach(value('a'))
  const original = block().attach(child)
  const next = original()
  expect(next.children[0]).toBe(child)
  const isolated = block().attach(child())
  isolated.children[0].attach(value('b'))
  expect(child.children).toHaveLength(1)
  expect(isolated.children[0].children).toHaveLength(2)
})

test('离线构造、连接与派生不解析或激活', () => {
  const active = vi.fn()
  const child = value('2px', { onActive: active })
  const parse = vi.spyOn(child, 'parseCss')
  const original = block().attach(child)
  original()
  expect(active).not.toHaveBeenCalled()
  expect(parse).not.toHaveBeenCalled()
  expect(original.parseCss()).toBe('2px')
})

test('额外依赖共享激活，不自动拼入输出', () => {
  const active = vi.fn()
  const dependency = value('hidden', { onActive: active })
  const original = block(undefined, { dependence: [dependency] }).attach(value('shown'))
  const next = original()
  expect(next.dependence).not.toBe(original.dependence)
  expect(next.dependence[0]).toBe(dependency)
  original.activate()
  next.activate()
  expect(active).toHaveBeenCalledTimes(1)
  expect(original.parseCss()).toBe('shown')
})

test('活对象新增连接立即激活实际输入，不提前解析', () => {
  const parent = block()
  parent.activate()
  const active = vi.fn()
  const child = value('late', { onActive: active })
  const parse = vi.spyOn(child, 'parseCss')
  parent.attach(child, child)
  parent.activate()
  expect(parent.children[0]).toBe(child)
  expect(child.isActive).toBe(true)
  expect(active).toHaveBeenCalledTimes(1)
  expect(parse).not.toHaveBeenCalled()
})

test('从活对象派生得到未激活的新对象，动作的 this 也是新对象', () => {
  const receivers: Block[] = []
  const original = block(undefined, {
    /** 记录实际激活对象。 */
    onActive() { receivers.push(this) },
  })
  original.activate()
  const next = original()
  expect(next.isActive).toBe(false)
  next.activate()
  expect(receivers).toEqual([original, next])
})

test('重入激活及激活中追加子级均只执行一次', () => {
  const late = value('late', { onActive: vi.fn() })
  const original = block(undefined, {
    /** 在激活过程中继续组装，不生成新的对象身份。 */
    onActive() { this.attach(late); this.activate() },
  })
  original.activate()
  expect(late.isActive).toBe(true)
  expect(late.onActive).toHaveBeenCalledTimes(1)
})

test('选择器按语义解析嵌套和空规则，普通组合不增加花括号', () => {
  const color = property('color', value('blue'))
  const grouped = block().attach(color)
  const nested = selector('.input').attach(grouped, selector('&:hover').attach(color))
  expect(nested.parseCss()).toBe('.input { color: blue;\n&:hover { color: blue; } }')
  expect(selector('.empty').parseCss()).toBe('.empty {  }')
  expect(grouped.parseCss()).toBe('color: blue;')
})
