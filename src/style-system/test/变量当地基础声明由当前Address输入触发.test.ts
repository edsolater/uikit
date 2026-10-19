/** 从编译CSS验证当地声明门槛，不读取Variable的私有声明树。 */
import { expect, test } from 'vitest'
import { parse, type AnyNode } from 'postcss'
import { compileRules } from '../css-root'
import { declare } from '../operations/declare'
import { multiply } from '../pieces/contents/functions/calc'
import { variable } from '../variable'

function declarationsAt(css: string, path: string[]) {
  const declarations: string[] = []
  parse(css).walkDecls(declaration => {
    const headers: string[] = []
    for (let parent: AnyNode | undefined = declaration.parent; parent; parent = parent.parent) {
      if (parent.type === 'rule') headers.unshift(parent.selector)
    }
    // 同时接受嵌套CSS和等效扁平选择器。
    if (headers.join(' ') === path.join(' ')) declarations.push(`${declaration.prop}: ${declaration.value}`)
  })
  return declarations
}

test('Card与Inner纯消费保留属性引用，不复制基本量及依赖量当地基础', () => {
  const basicSize = variable('1em', 'address-basic-size')
  const cardWidth = variable(multiply(basicSize, 20), 'address-card-width')
  const css = compileRules([
    [['.Card'], 'width', cardWidth],
    [['.Card', '.Inner'], 'width', cardWidth],
  ])
  for (const path of [['.Card'], ['.Card', '.Inner']]) {
    const declarations = declarationsAt(css, path)
    expect.soft(declarations).toContain('width: var(--address-card-width)')
    expect.soft(declarations.some(item => item.startsWith('--address-basic-size:'))).toBe(false)
    expect.soft(declarations.some(item => item.startsWith('--address-card-width:'))).toBe(false)
  }
  expect(css).toContain('--address-basic-size: 1em;')
  expect(css).toContain('--address-card-width: calc(var(--address-basic-size) * 20);')
})

test.each(['base', 'amount'])('任一输入在Card声明即联动，另一输入继承；Inner不复制：%s', input => {
  const base = variable(4, 'address-or-base')
  const amount = variable(2, 'address-or-amount')
  const result = variable(multiply(base, amount), 'address-or-result')
  const changed = input === 'base' ? base : amount
  const inherited = input === 'base' ? amount : base
  const css = compileRules([
    [['.Card'], ...declare(changed, 7)],
    [['.Card'], 'z-index', result],
    [['.Card', '.Inner'], 'z-index', result],
  ])
  const card = declarationsAt(css, ['.Card'])
  const inner = declarationsAt(css, ['.Card', '.Inner'])
  expect.soft(card.some(item => item.startsWith('--address-or-result:'))).toBe(true)
  expect.soft(card.some(item => item.startsWith(`${inherited.toCSSString()}:`))).toBe(false)
  expect.soft(inner).toContain('z-index: var(--address-or-result)')
  expect.soft(inner.some(item => item.startsWith('--address-or-result:'))).toBe(false)
  expect.soft(inner.some(item => item.startsWith(`${changed.toCSSString()}:`))).toBe(false)
})
