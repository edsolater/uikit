/** 普通函数读取定义产生 Token，不依赖内置用途或加工历史。 */
import { stateCondition } from '../state-condition'
import { expect, test } from 'vitest'
import { token, type Token, type TokenInput } from '../token'
import { compileRules } from '../css-root'
import { multiply, add } from '../pieces/functions/calc'

test('普通函数换基础并显式复用 State，规则用新基础而固定状态保持原值', () => {
  const state = [
    [stateCondition('&[data-hover]'), (base) => add(base, '3px')],
    [stateCondition('&[data-active]'), '12px'],
  ] as const
  const source = token('10px', {
    name: 'function-source',
    state,
    address: '.FunctionHome',
  })
  const replaceBase = (base: TokenInput) =>
    token(base, {
      name: 'function-result',
      state: source.state,
      address: source.address,
    })
  const result = replaceBase('5px')
  const css = compileRules([
    [['.Consumer'], 'width', result],
    [['.Original'], 'width', source],
  ])
  expect(css).toContain('--function-result: 5px;')
  expect(css).toContain('calc(5px + 3px)')
  expect(css).toContain('--function-result: 12px;')
  expect(css).toContain('--function-source: 10px;')
  expect(css).toContain('calc(10px + 3px)')
})

test('逐项加工最终结果保存组合后的定义，后续换 default 不重放旧加工', () => {
  const source = token('10px', {
    state: { hover: (base) => add(base, '3px'), active: '12px' },
  })
  const half = (input: Token<TokenInput>) =>
    token<TokenInput>(multiply(input.default, 0.5), {
      name: 'halved',
      state: new Map(
        Array.from(input.state ?? []).map(([name, rule]) => [
          name,
          multiply(
            typeof rule === 'function' ? rule(input.default) : rule,
            0.5,
          ),
        ]),
      ),
    })
  const result = half(source)
  expect(compileRules([[['.Result'], 'width', result]])).toContain(
    'calc(12px * 0.5)',
  )
  result.default = '7px'
  const css = compileRules([[['.Result'], 'width', result]])
  expect(css).toContain('--halved: 7px;')
  expect(css).toContain('calc(12px * 0.5)')
  expect(css).not.toContain('calc(7px * 0.5)')
})

test('用途由普通函数产生独立 Token，定义基础为零时不退回来源', () => {
  const source = token(1, { name: 'purpose-source', state: { disabled: 0.5 } })
  const quiet = (base: Token) =>
    token(multiply(base, 0.2), {
      name: 'purpose-quiet',
      state: { disabled: 0 },
    })
  const result = quiet(source)
  const css = compileRules([[['.Quiet'], 'opacity', result]])
  expect(css).toContain('var(--purpose-source)')
  expect(css).toContain('--purpose-quiet: 0;')
})

test('实际对象引用不激活另一个同名定义，CSS 引用字符串不借用对象资源', () => {
  const source = token('red', 'object-color')
  token('blue', {
    name: 'object-color',
    onFirstScan() {
      throw new Error('同名对象未被引用')
    },
  })
  const css = compileRules([[['.Object'], 'color', source]])
  expect(css).toContain('--object-color: red;')
  expect(css).not.toContain('--object-color: blue;')
  const nameOnly = compileRules([[['.Name'], 'color', 'var(--object-color)']])
  expect(nameOnly).toContain('color: var(--object-color);')
  expect(nameOnly).not.toContain('--object-color:')
})

test('独立 State 被多个基础值复用，状态不复制来源定义', () => {
  const state = [
    [stateCondition('&[data-large]'), (base) => multiply(base, 2)],
  ] as const
  const first = token('3px', { name: 'state-first', state })
  const second = token('7px', { name: 'state-second', state })
  const css = compileRules([
    [['.First'], 'width', first],
    [['.Second'], 'width', second],
  ])
  expect(css).toContain('calc(3px * 2)')
  expect(css).toContain('calc(7px * 2)')
})
