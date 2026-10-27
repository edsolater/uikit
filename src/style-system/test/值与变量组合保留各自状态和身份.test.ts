/** 稳定组合不会传播 Token 的状态。 */
import { token } from '../token'
import { expect, test, vi } from 'vitest'

import { condition } from '../condition'
import { createJSSContent } from '../content'
import { colorMix } from '../pieces/functions/color-mix'

import { compileRules } from '../css-root'
import { stateCondition } from '../state-condition'

import { cssFunction } from '../css-function'
import type { Rules } from '../rule'

const functionMedia = stateCondition('@media (width > 1px)')

const independentStates = Array.from({ length: 10 }, (_, index) =>
  stateCondition(`&[data-independentState${index}]`),
)

test.each([2, 5, 10])(
  '两个变量各有 %i 个状态时，定义数量随状态数增长而不产生交集',
  (count) => {
    const states = new Map(
      independentStates
        .slice(0, count)
        .map((condition) => [condition, '2px'] as const),
    )
    const first = token('1px', {
      name: 'independent-first-size',
      state: states,
    })
    const second = token('1px', {
      name: 'independent-second-size',
      state: states,
    })
    const css = compileRules([
      [[condition('.Independent')], 'width', first],
      [[condition('.Independent')], 'height', second],
    ])
    expect(css.match(/--independent-first-size:/g)).toHaveLength(count + 1)
    expect(css.match(/--independent-second-size:/g)).toHaveLength(count + 1)
    expect(css.match(/(?:^|\n)width:/g)).toHaveLength(1)
    expect(css.match(/(?:^|\n)height:/g)).toHaveLength(1)
  },
)

test.each([false, true])(
  '状态内引用与普通消费交换顺序后，依赖仍有常态和自身状态：%s',
  (ordinaryFirst) => {
    const inner = token('10px', {
      name: 'audit-inner-size',
      state: { hover: '20px' },
    })
    const outer = token('1px', {
      name: 'audit-outer-size',
      state: { hover: inner },
    })
    const source: Rules = [
      [[condition('.Audit')], 'margin-left', outer],
      [[condition('.Audit')], 'width', inner],
    ]
    const css = compileRules(ordinaryFirst ? source.reverse() : source)
    expect(css.match(/--audit-inner-size:/g)).toHaveLength(2)
    expect(css).toContain('--audit-inner-size: 10px;')
    expect(css).toContain('--audit-inner-size: 20px;')
  },
)

test('函数的局部 Token 与 result 留在同一份函数定义', () => {
  const size = token('16px', {
    name: 'function-size',
    state: [[functionMedia, '20px']],
  })
  const content = cssFunction('--measured-size() returns <length>', [
    [undefined, 'result', size],
  ])()
  const css = compileRules([[[condition('.Example')], 'font-size', content]])
  expect(css.match(/@function --measured-size/g)).toHaveLength(1)
  expect(css).toContain('--function-size: 20px;')
  expect(css).toContain('result: var(--function-size);')
})

test('多个有状态变量组合时，消费属性仍只有一份声明', () => {
  const first = token('black', {
    name: 'first-color',
    state: { hover: 'navy', active: 'blue' },
  })
  const second = token('white', {
    name: 'second-color',
    state: { hover: 'silver', active: 'gray' },
  })
  const ratio = token(0.8, {
    name: 'mix-ratio',
    state: { hover: 0.7, active: 0.6 },
  })
  const css = compileRules([
    [
      [condition('.Mix')],
      'background',
      token(colorMix([first, ratio], second)),
    ],
  ])
  expect(css.match(/(?:^|\n)background:/g)).toHaveLength(1)
  expect(css).toContain('--first-color: navy;')
  expect(css).toContain('--second-color: silver;')
  expect(css).toContain('--mix-ratio: 0.7;')
})

test('共享 Token 在不同地址分别解析，重复编译不修改来源对象', () => {
  const source = token('2px', {
    name: 'shared-position-size',
    address: '.Audit',
    state: { hover: '4px' },
  })
  const shared = token(source)
  const rules: Rules = [
    [[condition('.Audit .AuditA')], 'width', shared],
    [[condition('.Audit .AuditB')], 'width', shared],
  ]
  const compileAndCheck = () => {
    const css = compileRules(rules)
    expect(css).toContain('--shared-position-size: 2px;')
    expect(css).toContain('--shared-position-size: 4px;')
    expect(css).toContain('width: var(--shared-position-size);')
  }

  compileAndCheck()
  expect(shared.default).toBe(source)
  compileAndCheck()
  expect(shared.default).toBe(source)
})

test('零值不会沿来源链退回', () => {
  const source = token(1, { name: 'source-opacity', state: { disabled: 0.5 } })
  const next = token(source, { name: 'next-opacity', state: { disabled: 0 } })
  expect(compileRules([[[condition('.Example')], 'opacity', next]])).toContain(
    '--next-opacity: 0;',
  )
})

test('延伸的注册使用新名字，来源默认值继续按需读取', () => {
  const source = token('blue', { name: 'registered-source-color' })
  const next = token(source, {
    name: 'registered-next-color',
    registration: { syntax: '<color>', inherits: true, initialValue: 'black' },
  })
  const css = compileRules([[[condition('.Example')], 'color', next]])
  expect(css).toContain('@property --registered-next-color')
  expect(css).toContain('var(--registered-source-color)')
  expect(css).not.toContain('@property --registered-source-color')
})
test('稳定 Token 共享引用不误报循环，真实循环停止', () => {
  const shared = token('red')
  expect(
    compileRules([[[condition('.Shared')], 'color', colorMix(shared, shared)]]),
  ).toContain('color: color-mix(in oklab, red, red);')
  const cycle = token<import('../token').TokenData>({ default: undefined })
  cycle.default = cycle
  expect(() => compileRules([[[condition('.Cycle')], 'color', cycle]])).toThrow(
    '循环引用',
  )
})
test('动态内容没有被消费时不执行，消费时产生 CSS', () => {
  const serialize = vi.fn(() => 'blue')
  const source = token(createJSSContent(serialize), { name: 'deferred-color' })
  expect(serialize).not.toHaveBeenCalled()
  expect(compileRules([[[condition('.Example')], 'color', source]])).toContain(
    'color: var(--deferred-color);',
  )
  expect(serialize).toHaveBeenCalled()
})

test('两个具体Token的onFirstScan各自执行一次，共享引用不重复', () => {
  const directActive = vi.fn((): Rules => [
    [[condition(':root')], '--direct-active', '1'],
  ])
  const direct = token('red', {
    name: 'generic-active-variable',
    onFirstScan: directActive,
  })
  const defaultActive = vi.fn((): Rules => [
    [[condition(':root')], '--second-active', '1'],
  ])
  const defaultMember = token('blue', {
    name: 'generic-active-second',
    onFirstScan: defaultActive,
  })

  const css = compileRules([
    [[condition('.GenericActivation')], 'color', direct],
    [[condition('.GenericActivation')], 'background', defaultMember],
  ])

  expect(directActive).toHaveBeenCalledTimes(1)
  expect(defaultActive).toHaveBeenCalledTimes(1)
  expect(css).toContain('--direct-active: 1;')
  expect(css).toContain('--second-active: 1;')
})
