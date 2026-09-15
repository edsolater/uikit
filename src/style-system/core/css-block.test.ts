/** Block 的身份、累计状态、实例隔离与嵌套输出。 */
import { expect, test } from 'vitest'
import { frame, keyframes } from '../blocks/keyframe'
import { media } from '../blocks/media'
import { propertyRule } from '../blocks/property'
import { styleRule } from '../blocks/style'
import { declaration } from './css-declaration'
import { key } from './css-key'
import { value } from './css-value'
import { stateHover } from '../selectors/msic'

test('attach 累计到同一实例，来源集合与另建实例不共享列表', () => {
  const color = declaration(key('color'), value('red'))
  const opacity = declaration(key('opacity'), value(0.5))
  const source = [color]
  const rule = styleRule('.example')
  const body = rule.body

  expect(typeof rule).toBe('object')
  expect(rule.of()).toBe(rule)
  expect(rule.of(source)).toBe(rule)
  expect(rule.of([[opacity]])).toBe(rule)
  source.length = 0
  expect(body).toBe(rule.body)
  expect(body).toEqual([color, opacity])
  expect(styleRule('.example').body).toEqual([])
  expect(rule.parseCss()).toBe('.example { color: red;\nopacity: 0.5; }')
})

test('已连接的子 Block 继续累计，媒体、关键帧和注册规则使用同一能力', () => {
  const opacity = declaration(key('opacity'), value(0.5))
  const rule = styleRule('.example')
  const responsive = media('(min-width: 1px)')
  expect(responsive.of(rule)).toBe(responsive)
  rule.of(opacity)
  expect(responsive.parseCss()).toBe('@media (min-width: 1px) { .example { opacity: 0.5; } }')

  const name = value('fade')
  const animation = keyframes(name)
  const start = frame('from')
  expect(animation.of(start)).toBe(animation)
  expect(start.of(opacity)).toBe(start)
  expect(animation.name).toBe(name)
  expect(animation.parseCss()).toBe('@keyframes fade { from { opacity: 0.5; } }')

  const registration = propertyRule('fade-opacity')
  const syntax = declaration(key('syntax'), value('"<number>"'))
  expect(registration.of(syntax)).toBe(registration)
  expect(registration.name).toBe('fade-opacity')
  expect(registration.parseCss()).toBe('@property --fade-opacity { syntax: "<number>"; }')
})

test('共享选择条件创建独立入口，已连接的状态可继续补充', () => {
  const first = styleRule(stateHover)
  const second = styleRule(stateHover)
  const parent = styleRule('.example').of(first)
  const color = declaration(key('color'), value('red'))

  first.of(color)
  expect(second.body).toEqual([])
  expect(parent.body[0]).toBe(first)
  expect(parent.parseCss()).toBe('.example { &:where(:hover):not(:disabled) { color: red; } }')
})
