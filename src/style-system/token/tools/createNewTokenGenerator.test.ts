/** 生成器的自动名称、统一地址与 Token 内容配置。 */
import { expect, expectTypeOf, test } from 'vitest'
import { compileRules } from '../../css-root'
import { token } from '../core'
import { createNewTokenGenerator } from './createNewTokenGenerator'

test('具名来源保留可追溯前缀，每次派生自动唯一且状态独立', () => {
  const buttonToken = createNewTokenGenerator({
    prefixName: 'button',
    address: '.NamedButton',
  })
  const source = token('red', { name: 'brand-color', address: ':root' })
  const first = buttonToken(source, { state: { hover: 'blue' } })
  const second = buttonToken(source, { state: { hover: 'green' } })
  expect(first.name).toMatch(/^button-brand-color-.+/)
  expect(second.name).toMatch(/^button-brand-color-.+/)
  expect(new Set([first.name, second.name]).size).toBe(2)
  const css = compileRules([
    [['.NamedButton'], 'color', first],
    [['.NamedButton'], 'background-color', second],
  ])
  expect(css).toContain(`--${first.name}: var(--brand-color);`)
  expect(css).toContain(`--${second.name}: var(--brand-color);`)
  expect(css).toContain(`color: var(--${first.name});`)
  expect(css).toContain(`background-color: var(--${second.name});`)
  expect(css).toContain(`--${first.name}: blue;`)
  expect(css).toContain(`--${second.name}: green;`)
  expect(css).not.toContain(`--${first.name}: green;`)
  expect(css).not.toContain(`--${second.name}: blue;`)
})

test('统一地址保留来源引用并合并状态，来源不被改写', () => {
  const source = token('8px', {
    name: 'generator-source',
    address: ':root',
    state: { hover: '12px' },
  })
  const panelToken = createNewTokenGenerator({
    prefixName: 'panel',
    address: '.Panel',
  })
  const local = panelToken(source, { state: { active: '16px' } })
  const css = compileRules([[['.Consumer'], 'width', local]])
  expect(local.address).toBe('.Panel')
  expect(source.address).toBe(':root')
  expect(css).toMatch(
    new RegExp(
      `\\.Panel\\s*\\{[^}]*--${local.name}: var\\(--generator-source\\);`,
    ),
  )
  expect(css).toContain(`--${local.name}: 12px;`)
  expect(css).toContain(`--${local.name}: 16px;`)
  expect(css).not.toContain('--generator-source: 16px;')
})

test('无名来源的不同结果自动取得独立名称，状态不互相覆盖', () => {
  const source = token('8px')
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
  expect(first.name).toMatch(/^panel-/)
  expect(second.name).toMatch(/^panel-/)
  expect(first.name).not.toBe(second.name)
  expect(css).toContain(`width: var(--${first.name});`)
  expect(css).toContain(`height: var(--${second.name});`)
  expect(css).toContain(`--${first.name}: 12px;`)
  expect(css).toContain(`--${second.name}: 16px;`)
  expect(css).not.toContain(`--${first.name}: 16px;`)
  expect(css).not.toContain(`--${second.name}: 12px;`)
})

test('保留泛型、特殊格式与 default 覆盖，调用配置不接受名称和地址', () => {
  const createToken = createNewTokenGenerator({
    prefixName: 'forms',
    address: '.Forms',
  })
  const number = createToken(2)
  const text = createToken('4px')
  const structured = createToken(
    { amount: 7 },
    { toCSSString: (data) => `${data.amount}px` },
  )
  const copied = createToken(text, { default: 9 })
  expectTypeOf(number.default).toEqualTypeOf<number>()
  expectTypeOf(text.default).toEqualTypeOf<string>()
  expectTypeOf(structured.default).toEqualTypeOf<{ amount: number }>()
  expectTypeOf(copied.default).toEqualTypeOf<9>()
  type Options = NonNullable<Parameters<typeof createToken>[1]>
  expectTypeOf<string>().not.toExtend<Options>()
  expectTypeOf<{
    name: string
    state: { hover: number }
  }>().not.toExtend<Options>()
  expectTypeOf<{
    address: string
    state: { hover: number }
  }>().not.toExtend<Options>()
  const css = compileRules([
    [['.Forms'], 'opacity', number],
    [['.Forms'], 'height', structured],
    [['.Forms'], 'order', copied],
  ])
  expect(css).toContain(`--${number.name}: 2;`)
  expect(css).toContain(`--${structured.name}: 7px;`)
  expect(css).toContain(`--${copied.name}: 9;`)
})

test('未配置地址时随消费位置发布，不继承来源的固定地址', () => {
  const createToken = createNewTokenGenerator({ prefixName: 'local' })
  const source = token('8px', { name: 'local-source', address: ':root' })
  const local = createToken(source)
  const css = compileRules([[['.Local'], 'width', local]])
  expect(local.address).toBeUndefined()
  expect(css).toMatch(
    new RegExp(`\\.Local\\s*\\{[^}]*--${local.name}: var\\(--local-source\\);`),
  )
})
