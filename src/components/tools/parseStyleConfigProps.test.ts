/**
 * 样式属性输入归一验证。
 *
 * 验证配置优先级、动态字段形状与普通属性身份。
 *
 * 防止新调用语法改变既有配置值或节点输入。
 */
import { expect, test } from 'vitest'
import { createState, flush, val } from '@/foundation'
import { parseStyleConfigProps } from './parseStyleConfigProps'

test('显式字段覆盖前缀字段，保留来源及普通函数身份', () => {
  const gap = createState('2rem')
  const action = () => '执行'
  const symbol = Symbol('业务字段')
  const source = {
    $direction: 'column',
    $gap: gap,
    $grow: true,
    $count: 0,
    $message: '',
    $nullable: null,
    styleConfig: { direction: undefined, grow: false },
    onClick: action,
    [symbol]: '原值',
  }
  const props = parseStyleConfigProps(source)
  expect(props.styleConfig).toEqual({
    direction: undefined,
    gap,
    grow: false,
    count: 0,
    message: '',
    nullable: null,
  })
  expect(props.onClick).toBe(action)
  expect(props[symbol]).toBe('原值')
  expect('$direction' in props).toBe(false)
  expect(Reflect.get(props, '$direction')).toBeUndefined()
  expect(Reflect.ownKeys(props)).toEqual(['styleConfig', 'onClick', symbol])
  expect(source.$direction).toBe('column')
})

test('配置存在性与枚举随前缀字段变化，整体来源按消费时读取', () => {
  const source: Record<string, unknown> = { title: '内容' }
  const props = parseStyleConfigProps(source)
  expect('styleConfig' in props).toBe(false)
  expect(Object.hasOwn(props, 'styleConfig')).toBe(false)
  source.$direction = 'column'
  expect('styleConfig' in props).toBe(true)
  expect(Object.keys(props)).toEqual(['title', 'styleConfig'])
  expect(
    Object.getOwnPropertyDescriptor(props, 'styleConfig')?.get?.(),
  ).toEqual({ direction: 'column' })
  const config = createState<{ direction?: string } | undefined>({
    direction: 'row',
  })
  source.styleConfig = config
  expect(props.styleConfig).toEqual({ direction: 'row' })
  config.set(undefined)
  flush()
  expect(props.styleConfig).toEqual({ direction: 'column' })
  delete source.$direction
  expect(props.styleConfig).toBe(config)
  expect(val(props.styleConfig)).toBeUndefined()
  delete source.styleConfig
  expect('styleConfig' in props).toBe(false)
  expect(Object.keys(props)).toEqual(['title'])
})
