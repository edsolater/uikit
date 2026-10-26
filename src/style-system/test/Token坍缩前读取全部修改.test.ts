/** Token 的扫描、编译时机与坍缩完成条件，禁止只为引用先后固定身份。 */
import { expect, test, vi } from 'vitest'
import { compileRules } from '../css-root'
import { token } from '../token'
import { add } from '../pieces/contents/functions/calc'
import { modify } from '../operations/modify'
import type { Rules } from '../rule'
import { condition } from '../condition'

test.each([false, true])('引用位于 modify 之前=%s，所有消费共用匿名目标的变量身份', referenceFirst => {
  const size = token('4px')
  const reference: Rules[number] = [['.Target'], 'width', size]
  const change: Rules[number] = [['.Target'], ...modify(size, { type: 'expression', detail: current => add(current, '3px') })]
  const css = compileRules(referenceFirst ? [reference, change] : [change, reference])
  expect(css).toMatch(/width: var\(--[^)]+\);/)
  expect(css).toContain('4px')
  expect(css).toContain('3px')
  expect(size._kind).toBe('css-variable')
})

test('多层首次扫描后才产生修改，不能提前输出直接值', () => {
  const size = token('4px')
  const last = token(1, { onFirstScan: () => [[['.Late'], ...modify(size, { type: 'expression', detail: current => add(current, '3px') })]] })
  const middle = token(1, { onFirstScan: () => [[['.MiddleTrigger'], 'opacity', last]] })
  const first = token(1, { onFirstScan: () => [[['.FirstTrigger'], 'opacity', middle]] })
  const css = compileRules([[['.Late'], 'width', size], [['.Trigger'], 'opacity', first]])
  expect(css).toMatch(/width: var\(--[^)]+\);/)
  expect(size._kind).toBe('css-variable')
})

test('编译回调插入的晚到修改也参与坍缩，去掉修改后下一编译恢复直接值', () => {
  const size = token('4px')
  const late = token(1, { compileWaveIndex: 2, onCompile(context, ast) {
    ast.insert({ after: context.node, conditionPath: { targetConditionPath: [condition('.Late')], stateConditionPath: [] } }, modify(size, { type: 'expression', detail: current => add(current, '3px') }), { owner: context.node })
  } })
  const css = compileRules([[['.Late'], 'width', size], [['.Trigger'], 'opacity', late]])
  expect(css).toMatch(/width: var\(--[^)]+\);/)
  expect(size._kind).toBe('css-variable')
  const restored = compileRules([[['.Late'], 'width', size]])
  expect(restored).toContain('width: 4px;')
  expect(restored).not.toContain('var(')
  expect(size._kind).toBe('css-value')
})

test('每对象每次编译扫描和编译各一次，波次门槛不推迟首次扫描', () => {
  const events: string[] = []
  const scan = vi.fn(() => { events.push('scan'); return [] })
  const compile = vi.fn(() => { events.push('compile') })
  const shared = token('2px', { compileWaveIndex: 3, onFirstScan: scan, onCompile: compile })
  const witness = token('1px', { compileWaveIndex: 2, onCompile() { expect(scan).toHaveBeenCalledTimes(1); expect(compile).not.toHaveBeenCalled() } })
  const rules: Rules = [[['.First'], 'width', shared], [['.Second'], 'height', shared], [['.Witness'], 'width', witness]]
  const css = compileRules(rules)
  expect(css).toContain('width: 2px;')
  expect(css).toContain('height: 2px;')
  expect(scan).toHaveBeenCalledTimes(1)
  expect(compile).toHaveBeenCalledTimes(1)
  expect(events).toEqual(['scan', 'compile'])
  scan.mockClear(); compile.mockClear(); events.length = 0
  compileRules(rules)
  expect(scan).toHaveBeenCalledTimes(1)
  expect(compile).toHaveBeenCalledTimes(1)
})

test('编译回调返回值不替代内容，AST 操作和自己的输出方法都生效', () => {
  const source = token('2px', { onCompile: (() => '99px') as () => void })
  const rewritten = token('3px', { onCompile(context, ast) { ast.setContent(context, '4px') } })
  const css = compileRules([[['.Return'], 'width', source], [['.Rewrite'], 'height', rewritten]])
  expect(css).toContain('width: 2px;')
  expect(css).not.toContain('99px')
  expect(css).toContain('height: 4px;')
})
