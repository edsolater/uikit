/** 验证基础 Token 的统一表达、组合顺序与延迟求值。 */
import { expect, test, vi } from 'vitest'
import { cssBlock } from '../core/css-block'
import { boxShadow, margin, marginBottom, marginLeft, marginRight, marginTop } from './base-css'

test('六个基础方法全部返回不强制包裹的 Block', () => {
  for (const token of [margin, marginTop, marginRight, marginBottom, marginLeft, boxShadow]) {
    const output = vi.fn(() => '0px')
    const box = token(cssBlock(output))
    expect(typeof box.attach).toBe('function')
    expect(output).not.toHaveBeenCalled()
    expect(String(box)).not.toContain('{')
  }
})

test('共享值只激活一次，接通后的新增依赖立即激活但不提前转换', () => {
  const activate = vi.fn()
  const box = margin(cssBlock('2px', { onActive: activate }))
  box.activate()
  box.activate()
  expect(activate).toHaveBeenCalledTimes(1)
  const lateActivate = vi.fn()
  const output = vi.fn(() => 'none')
  box.attach(boxShadow(cssBlock(output, { onActive: lateActivate })))
  expect(lateActivate).toHaveBeenCalledTimes(1)
  expect(output).not.toHaveBeenCalled()
})

test('默认 slot 保持挂载顺序，不产生多余花括号', () => {
  const box = cssBlock().attach(marginLeft(cssBlock('2px'))).attach(marginLeft(cssBlock('4px')))
  expect(String(box).replace(/\s/g, '')).toBe('margin-left:2px;margin-left:4px;')
})
