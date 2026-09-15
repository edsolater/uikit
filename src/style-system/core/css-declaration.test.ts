/** 检查声明保留原对象引用，以及文本输出与激活的边界。 */
import { expect, expectTypeOf, test, vi } from 'vitest'
import type { Block } from './css-block'
import { declaration, type Declaration, type DeclarationRole } from './css-declaration'
import { key, type Key } from './css-key'
import { parseValue, value, type RenderContext, type Value } from './css-value'
import { styleRule } from '../blocks/style'
import { color } from '../declarations/color'
import { padding } from '../declarations/padding'
import { margin } from '../declarations/margin'
import { font } from '../declarations/font'
import { transition } from '../declarations/transition'
import { boxShadow, type BoxShadowDeclaration } from '../declarations/box-shadow'
import { shadowValue, type Shadow } from '../values/shadow'
import { valueList } from '../values/list'
import { declareVariable, variable } from './css-variable'

test('Key 与 Value 组成独立 Declaration，并由 Declaration 负责标点', () => {
  const active = vi.fn()
  const colorKey = key('color')
  const blue = value('blue', { onActive: active })
  const first = declaration(colorKey, blue)
  const second = declaration(colorKey, blue)
  expectTypeOf(colorKey).toEqualTypeOf<Key<'color'>>()
  expectTypeOf(first).toEqualTypeOf<Declaration<'color'>>()
  expectTypeOf<Declaration>().not.toExtend<Block>()
  expect(typeof colorKey).toBe('object')
  expect(first.name).toBe(colorKey.name)
  expect(second).not.toBe(first)
  expect(first.content).toBe(blue)
  expect(first.parseCss()).toBe('color: blue;')
  expect(active).not.toHaveBeenCalled()
})

test('普通声明不提供通用替换入口，单值属性也不提供多项追加', () => {
  const foreground = color('red')
  const rule = styleRule('.example').of([[foreground]])
  expect(rule.body[0]).toBe(foreground)
  expect(rule.parseCss()).toBe('.example { color: red; }')
  expect('set' in foreground).toBe(false)
  expect('_set' in foreground).toBe(false)
  expect('append' in foreground).toBe(false)
  expect(styleRule('.other').of(color('red')).parseCss()).toContain('color: red;')
})

test('Declaration 包含 Role；名称表明目的，Role 可输出多个属性并保留子值激活', () => {
  const blue = value('blue')
  const content = { color: blue }
  const role: DeclarationRole<{ color: Value }> = {
    parseCss(_name, content, context) {
      const color = parseValue(content.color, context)
      return `color: ${color};\nborder-color: ${color};`
    },
  }
  const appearance = declaration('accent-appearance', content, role)
  const rule = styleRule('.example').of(appearance)
  const visited: Value[] = []
  expect(rule.parseCss({ activateValue: (child) => visited.push(child) })).toBe('.example { color: blue;\nborder-color: blue; }')
  expect(appearance.name).toBe('accent-appearance')
  expect(appearance.content).toBe(content)
  expect(appearance.role).toBe(role)
  expect(visited).toEqual([blue])

  const parser = vi.fn((content: { color: Value }, context?: RenderContext) => parseValue(content.color, context))
  expect(declaration(key('color'), content, parser).parseCss()).toBe('color: blue;')
  expect(parser).toHaveBeenCalledExactlyOnceWith(content, undefined)
})

test('单条与多条输出都是 Declaration，Block 保留节点而不拆开内部内容', () => {
  const inset = padding({ top: '2px', left: '8px' })
  const spacing = margin('6px')
  const rule = styleRule('.example').of([[inset]], spacing)
  expect(inset.kind).toBe('declaration')
  expect(spacing.kind).toBe('declaration')
  expect(inset.name).toBe('padding')
  expect(spacing.name).toBe('margin')
  expect('set' in inset).toBe(false)
  expect(rule.body).toEqual([inset, spacing])
  expect(rule.parseCss()).toBe(
    '.example { padding-top: 2px;\npadding-left: 8px;\nmargin-top: 6px;\nmargin-right: 6px;\nmargin-bottom: 6px;\nmargin-left: 6px; }',
  )
  expect(padding({ bottom: '3px' }).parseCss()).toBe('padding-bottom: 3px;')
  expect(padding({}).parseCss()).toBe('')
})

test('过渡条目不被分组展开，只通过追加完整条目扩展已接入节点', () => {
  const timing = transition([key('opacity'), '100ms', 'ease'])
  const rule = styleRule('.example').of([[timing]])
  expect(timing.append(['transform', '200ms', 'linear', '30ms'])).toBe(timing)
  expect(rule.parseCss()).toContain('transition: opacity 100ms ease, transform 200ms linear 30ms;')
  expect('set' in timing).toBe(false)
  expect(transition('none').parseCss()).toBe('transition: none;')
  expect(() => transition('none').append(['opacity', '1s', 'ease'])).toThrow('请在构造处')
})

test('字体直接配置语义内容，阴影声明消费独立阴影并追加完整条目', () => {
  const typography = font({ size: '16px', lineHeight: '1.5', family: 'system-ui' })
  const contact = shadowValue({ x: '0', y: '1px', blur: '2px', color: 'black' })
  const shadow = boxShadow(contact)
  expectTypeOf(contact).toEqualTypeOf<Shadow>()
  expectTypeOf(shadow).toEqualTypeOf<BoxShadowDeclaration>()
  expectTypeOf<Shadow>().not.toExtend<Declaration>()
  expect(Array.isArray(shadow.content) && shadow.content[0]).toBe(contact)
  const rule = styleRule('.example').of(typography, shadow)
  shadow.append(shadowValue({ x: '0', y: '2px', blur: '4px', spread: '1px', color: 'red', inset: true }))
  expect(rule.parseCss()).toContain('font: 16px/1.5 system-ui;')
  expect(rule.parseCss()).toContain('box-shadow: 0 1px 2px black, inset 0 2px 4px 1px red;')
  expect(boxShadow(shadowValue({ x: '0', y: '0', spread: '2px', color: 'black' })).parseCss()).toBe('box-shadow: 0 0 0 2px black;')
  expect(boxShadow('none').parseCss()).toBe('box-shadow: none;')
  expect(() => boxShadow('none').append(shadowValue({ x: '0', y: '0' }))).toThrow('请在构造处')
})

test('同一阴影独立于消费 Key，值列表保留单项身份和子值激活', () => {
  const distance = value('2px')
  const contact = shadowValue({ x: '0', y: distance, color: 'black' })
  const diffuse = shadowValue({ x: '0', y: '6px', blur: '18px', color: 'red' })
  const shadows = valueList(contact, diffuse)
  const variableUse = variable('shared-shadow', { fallback: shadows })
  const visited: Value[] = []
  const context = { activateValue: (child: Value) => visited.push(child) }

  expect(shadows.items).toEqual([contact, diffuse])
  expect(shadows.items[0]).toBe(contact)
  expect(boxShadow(variableUse).parseCss(context)).toBe('box-shadow: var(--shared-shadow, 0 2px black, 0 6px 18px red);')
  expect(visited).toEqual([variableUse, shadows, contact, distance, diffuse])
  expect(declaration(key('text-shadow'), contact).parseCss()).toBe('text-shadow: 0 2px black;')

  const declarationUse = boxShadow(contact)
  contact.blur = distance
  expect(declarationUse.parseCss()).toBe('box-shadow: 0 2px 2px black;')
  expect(shadows.parseCss()).toBe('0 2px 2px black, 0 6px 18px red')
})

test('变量定义的 Role 同时激活目标变量和输入值', () => {
  const reference = variable('local-color')
  const blue = value('blue')
  const assigned = declareVariable(reference, blue)
  const rule = styleRule('.example').of(assigned)
  const visited: Value[] = []
  expect(rule.parseCss({ activateValue: (child) => visited.push(child) })).toContain('--local-color: blue;')
  expect(visited).toEqual([reference, blue])
})
