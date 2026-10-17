/** Variable 显式名称的消费，以及无 extend 时 name/default 必填的类型契约。 */
import { expect, test } from 'vitest'
import { variable } from './core'
import { condition } from '../condition'
import { compileRules } from '../css-root'

test('显式名称在消费与自身状态声明中保持一致', () => {
  const amount = variable(1, 'named-amount')
  const stateful = variable({ default: 2, hover: 3 }, { name: 'named-stateful', states: { active: 4 } })
  const css = compileRules([[[condition('.Named')], 'opacity', stateful]])
  expect(css).toContain('--named-stateful: 2;')
  expect(css).toContain('--named-stateful: 3;')
  expect(css).toContain('--named-stateful: 4;')
  expect(css).toContain('opacity: var(--named-stateful);')
  expect(amount.key.toCSSString()).toBe('--named-amount')
  expect(typeof amount.name).not.toBe('string')
})

// 来源：无 extend 时必须给 name/default；只约束公开类型，不增加运行时防御分支。
if (false) {
  // @ts-expect-error 没有 extend 时不能省略 name。
  variable(1)
  // @ts-expect-error 配置对象同样不能省略 name。
  variable(1, {})
  // @ts-expect-error 没有 extend 时不能省略 default。
  variable({ name: 'missing-default' })
  const source = variable(1, 'typed-extended-source')
  // 有 extend 时 default 和 name 都可继承；以下合法调用不应需要类型逃逸。
  variable({ extend: source })
  variable(2, { extend: source })
  // @ts-expect-error 名称在注册时绑定，不能在之后赋入字符串改名。
  source.name = 'renamed-after-registration'
}
