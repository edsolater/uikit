/** 生成器预设、名称和来源引用的输出行为。 */
import { expect, test } from 'vitest'
import { compileRules } from '../../css-root'
import { multiply } from '../../pieces/functions/calc'
import { token } from '../core'
import { createNewTokenGenerator } from './createNewTokenGenerator'

test('前缀名称与共同根据地复用来源状态，默认值仍引用全局来源', () => {
  const source = token('8px', {
    name: '--generator-space',
    state: { small: (base) => multiply(base, 1 / 2) },
  })
  const panelToken = createNewTokenGenerator({
    prefixName: 'panel',
    address: '.Panel',
  })
  const local = panelToken(source)
  const css = compileRules([[['.Panel'], 'width', local]])
  expect(css).toContain('--generator-space: 8px;')
  expect(css).toMatch(
    /\.Panel\s*\{[^}]*--panel-generator-space: var\(--generator-space\);/,
  )
  expect(css).toContain(
    '--panel-generator-space: calc(var(--generator-space) * 0.5);',
  )
  expect(css).toContain('width: var(--panel-generator-space);')
  expect(css).not.toContain('--generator-space: var(--generator-space);')
})

test('逐项覆盖预设名称、根据地与状态，来源不被改写', () => {
  const source = token(1, { name: 'generator-opacity', state: { hover: 0.5 } })
  const panelToken = createNewTokenGenerator({
    prefixName: 'panel',
    address: '.Panel',
  })
  const local = panelToken(source, {
    name: 'alternate-opacity',
    address: '.Alternate',
    state: { hover: 0.8, active: 0.4 },
  })
  const css = compileRules([
    [['.Source'], 'opacity', source],
    [['.Alternate'], 'opacity', local],
  ])
  expect(css).toMatch(
    /\.Alternate\s*\{[^}]*--alternate-opacity: var\(--generator-opacity\);/,
  )
  expect(css).toContain('--alternate-opacity: 0.8;')
  expect(css).toContain('--alternate-opacity: 0.4;')
  expect(css).toContain('--generator-opacity: 0.5;')
  expect(css).not.toContain('--generator-opacity: 0.8;')
  expect(css).not.toContain('--panel-generator-opacity')
})

test('匿名来源使用现有名称分配能力，每个生成结果都有独立名称', () => {
  const source = token('2px')
  const panelToken = createNewTokenGenerator({
    prefixName: 'anonymous',
    address: '.Anonymous',
  })
  const first = panelToken(source)
  const second = panelToken(source)
  const css = compileRules([
    [['.Anonymous'], 'width', first],
    [['.Anonymous'], 'height', second],
  ])
  expect(first.name).toMatch(/^anonymous-temp-/)
  expect(first.name).not.toBe(second.name)
  expect(css).toContain(`--${first.name}: 2px;`)
  expect(css).toContain(`--${second.name}: 2px;`)
})

test('单一入口保留创建形式与泛型，以及继承时 default 覆盖类型', () => {
  const createToken = createNewTokenGenerator({
    prefixName: 'forms',
    address: '.Forms',
  })
  const number = createToken(2, 'forms-number')
  const text = createToken('4px')
  const states = createToken(1, { state: { hover: 0.5 } })
  const structured = createToken(
    { amount: 7 },
    {
      name: 'forms-structured',
      address: '.AlternateForms',
      toCSSString: (data) => `${data.amount}px`,
    },
  )
  const copied = createToken(text, { default: 9, name: 'forms-copy' })
  const numericDefault: number = number.default
  const stringDefault: string = text.default
  const structuredDefault: { amount: number } = structured.default
  const copiedDefault: number = copied.default
  expect([
    numericDefault,
    stringDefault,
    structuredDefault.amount,
    copiedDefault,
  ]).toEqual([2, '4px', 7, 9])
  const css = compileRules([
    [['.Forms'], 'opacity', number],
    [['.Forms'], 'width', text],
    [['.Forms'], 'z-index', states],
    [['.AlternateForms'], 'height', structured],
    [['.Forms'], 'order', copied],
  ])
  expect(css).toContain('--forms-number: 2;')
  expect(css).toContain(`--${text.name}: 4px;`)
  expect(css).toContain(`--${states.name}: 0.5;`)
  expect(css).toMatch(/\.AlternateForms\s*\{[^}]*--forms-structured: 7px;/)
  expect(css).toContain('--forms-copy: 9;')
})
