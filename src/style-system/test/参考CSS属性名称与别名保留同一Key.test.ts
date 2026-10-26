/**
 * 参考 CSS 属性与自定义 Key 的名称消费验证。
 *
 * 验证完整参考清单、别名身份及显式登记后的组合效果。
 *
 * 防止漏表被字符串直通掩盖，或纯创建意外改变全局名称查找。
 * MDN Properties 2026-10-26 快照按用途与收录契约筛选，排除废弃与未获准项。
 */
import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import * as styleSystem from '../index'
import {
  $paddingTop,
  compileCSS,
  key,
  keyRegistry,
  propertyName,
  registerGlobalJSSKeyInStorage,
  resolveJSSKey,
  rules,
  token,
} from '../index'

const cssProperties = JSON.parse(
  readFileSync(
    new URL('./fixtures/mdn-css-properties.json', import.meta.url),
    'utf8',
  ),
) as string[]

test('预置属性排除废弃和无支持证据项，保留用户自定义声明入口', () => {
  const excluded = [
    'box-align',
    'box-direction',
    'box-flex',
    'box-flex-group',
    'box-lines',
    'box-ordinal-group',
    'box-orient',
    'box-pack',
    'clip',
    'page-break-after',
    'page-break-before',
    'page-break-inside',
    'text-decoration-skip',
    'user-modify',
    'background-repeat-x',
    'background-repeat-y',
    'font-synthesis-position',
    'link-parameters',
    'path-length',
    'speak-as',
    'caret',
    'image-resolution',
    'line-height-step',
    'font-smooth',
  ]
  for (const name of excluded) {
    expect(Object.hasOwn(keyRegistry, name), name).toBe(false)
    const variable =
      '$' +
      name.replace(/-([a-z0-9])/g, (_, character: string) =>
        character.toUpperCase(),
      )
    expect(styleSystem, variable).not.toHaveProperty(variable)
    expect(resolveJSSKey(name), name).toBe(name)
  }
  expect(Object.keys(keyRegistry).some((name) => name.startsWith('-'))).toBe(
    false,
  )
  expect(typeof resolveJSSKey('font-stretch')).toBe('object')
  expect(resolveJSSKey('--app-custom-color')).toBe('--app-custom-color')
  const custom = key('app-custom-layout')
  expect(resolveJSSKey(custom)).toBe(custom)
})

test('参考属性全集无需预热，原名与别名解析到同一个 Key', () => {
  expect(Object.keys(keyRegistry).sort()).toEqual([...cssProperties].sort())
  for (const name of cssProperties) {
    const resolved = resolveJSSKey(name)
    const alias = name.replace(/-([a-z0-9])/g, (_, character: string) =>
      character.toUpperCase(),
    )
    expect(typeof resolved, name).toBe('object')
    expect(propertyName(resolved), name).toBe(name)
    expect(resolveJSSKey(alias), alias).toBe(resolved)
    expect(keyRegistry[name], name).toBe(resolved)
  }
  expect(resolveJSSKey('paddingTop')).toBe($paddingTop)
})

test('对象身份与合法名称直通保留，未知和混合别名拒绝', () => {
  const target = key('registry-identity-target')
  const value = token('red', 'registry-identity-value')
  expect(resolveJSSKey(target)).toBe(target)
  expect(resolveJSSKey(value)).toBe(value)
  expect(resolveJSSKey('future-native-property')).toBe('future-native-property')
  expect(resolveJSSKey('--local-property')).toBe('--local-property')
  expect(resolveJSSKey('constructor')).toBe('constructor')
  expect(() => resolveJSSKey('toString')).toThrow('未知 JSSKey 名称')
  expect(() => resolveJSSKey('padding-topColor')).toThrow('未知 JSSKey 名称')
  expect(() => resolveJSSKey('unknownRegistryAlias')).toThrow(
    '未知 JSSKey 名称',
  )
})

test('纯创建不登记，直接目标和显式登记后的字符串共用组合规则', () => {
  const total = key('registry-custom-total', {
    join: (items) => items.reduce((sum, item) => sum + Number(item.content), 0),
  })
  expect(resolveJSSKey(total.name)).toBe(total.name)
  expect(() => resolveJSSKey('registryCustomTotal')).toThrow('未知 JSSKey 名称')
  const baseline = compileCSS()
  const direct = rules('.DirectTotal', [
    [total, 2],
    [total, 3],
  ])
  try {
    expect(compileCSS()).toContain('registry-custom-total: 5;')
  } finally {
    direct.remove()
  }
  registerGlobalJSSKeyInStorage(total)
  expect(resolveJSSKey(total.name)).toBe(total)
  expect(resolveJSSKey('registryCustomTotal')).toBe(total)
  const registered = rules('.RegisteredTotal', [
    [total, 2],
    { 'registry-custom-total': 3 },
    ['registryCustomTotal', 4],
  ])
  try {
    expect(compileCSS()).toContain('registry-custom-total: 9;')
  } finally {
    registered.remove()
  }
  expect(compileCSS()).toBe(baseline)
})

test('同名登记保留首个对象与组合协议，内建别名不能被不同原名占用', () => {
  const first = key('registry-first-total', { join: (items) => items.length })
  registerGlobalJSSKeyInStorage(first)
  registerGlobalJSSKeyInStorage(key(first.name, { join: () => 999 }))
  expect(resolveJSSKey(first.name)).toBe(first)
  expect(resolveJSSKey('registryFirstTotal')).toBe(first)
  registerGlobalJSSKeyInStorage(key('padding-top', { join: () => 999 }))
  expect(() =>
    registerGlobalJSSKeyInStorage(key('paddingTop', { join: () => 999 })),
  ).toThrow('JSSKey 名称冲突')
  expect(resolveJSSKey('padding-top')).toBe($paddingTop)
  expect(resolveJSSKey('paddingTop')).toBe($paddingTop)
  const handle = rules('.AfterConflict', [
    ['registryFirstTotal', 'a'],
    ['registry-first-total', 'b'],
    ['paddingTop', '1px'],
    ['padding-top', '2px'],
  ])
  try {
    expect(compileCSS()).toContain('registry-first-total: 2;')
    expect(compileCSS()).toContain('padding-top: 1px, 2px;')
  } finally {
    handle.remove()
  }
})

test('显式登记保留特殊名称自身的数据身份', () => {
  const special = key('__proto__')
  registerGlobalJSSKeyInStorage(special)
  expect(resolveJSSKey('__proto__')).toBe(special)
  expect(resolveJSSKey('constructor')).toBe('constructor')
})
