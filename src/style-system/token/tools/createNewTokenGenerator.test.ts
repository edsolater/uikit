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
  const panel = css.match(/\.Panel\s*\{([^}]*)\}/)?.[1]
  expect(local.name).toMatch(/^panel-/)
  expect(panel).toContain(`--${local.name}: var(--generator-space);`)
  expect(css).toContain(`--${local.name}: calc(var(--generator-space) * 0.5);`)
  expect(css).toContain(`width: var(--${local.name});`)
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
  expect(first.name).toMatch(/^anonymous-/)
  expect(first.name).not.toBe(second.name)
  expect(css).toContain(`--${first.name}: 2px;`)
  expect(css).toContain(`--${second.name}: 2px;`)
})

test('同一具名来源的不同状态定义拥有独立 CSS 身份，不互相覆盖', () => {
  const source = token('8px', { name: 'shared-generator-source' })
  const panelToken = createNewTokenGenerator({
    prefixName: 'panel',
    address: '.Independent',
  })
  const first = panelToken(source, { state: { hover: '12px' } })
  const second = panelToken(source, { state: { hover: '16px' } })
  const css = compileRules([
    [['.Independent'], 'width', first],
    [['.Independent'], 'height', second],
  ])
  expect(first.name).not.toBe(second.name)
  expect(css).toContain(`width: var(--${first.name});`)
  expect(css).toContain(`height: var(--${second.name});`)
  expect(css).toContain(`--${first.name}: var(--shared-generator-source);`)
  expect(css).toContain(`--${second.name}: var(--shared-generator-source);`)
  expect(css).toContain(`--${first.name}: 12px;`)
  expect(css).toContain(`--${second.name}: 16px;`)
  expect(css).not.toContain(`--${first.name}: 16px;`)
  expect(css).not.toContain(`--${second.name}: 12px;`)
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

test('只预设前缀时原始值随使用地定义，来源已有地址时继续固定发布', () => {
  const createToken = createNewTokenGenerator({ prefixName: 'only-prefix' })
  const local = createToken('2px')
  const source = token('8px', {
    name: 'prefix-fixed-source',
    address: ':where(:root)',
  })
  const fixed = createToken(source)
  const css = compileRules([
    [['.PrefixLocal'], 'width', local],
    [['.PrefixFixed'], 'height', fixed],
  ])
  expect(css).toMatch(
    new RegExp(`\\.PrefixLocal\\s*\\{[^}]*--${local.name}: 2px;`),
  )
  expect(css).toMatch(
    new RegExp(
      `:where\\(:root\\)\\s*\\{[^}]*--${fixed.name}: var\\(--prefix-fixed-source\\);`,
    ),
  )
  expect(fixed.address).toBe(':where(:root)')
  const cleared = createToken(source, { address: undefined })
  const localCSS = compileRules([[['.PrefixCleared'], 'width', cleared]])
  expect(localCSS).toMatch(
    new RegExp(
      `\\.PrefixCleared\\s*\\{[^}]*--${cleared.name}: var\\(--prefix-fixed-source\\);`,
    ),
  )
})
