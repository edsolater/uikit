/** Variable 显式名称的消费，以及无 derive 时 name/default 必填的类型契约。 */
import { expect, test } from 'vitest'
import { variable } from './core'
import { condition } from '../condition'
import { compileRules } from '../css-root'
import type { ValueInput } from '../value'

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

// 来源：普通创建必须给 name/default；只约束公开类型，不增加运行时防御分支。
if (false) {
  // @ts-expect-error 普通创建时不能省略 name。
  variable(1)
  // @ts-expect-error 配置对象同样不能省略 name。
  variable(1, {})
  // @ts-expect-error 没有 derive 时不能省略 default。
  variable({ name: 'missing-default' })
  const source = variable(1, 'typed-extended-source')
  // derive()沿用默认和名称；以下合法调用不应需要类型逃逸。
  source.derive()
  source.derive(2, {})
  // @ts-expect-error 名称在注册时绑定，不能在之后赋入字符串改名。
  source.name = 'renamed-after-registration'
  source.derive(source.content, { states: { hover: 2 }, priority: 0 })
  // @ts-expect-error 单参是默认内容，配置差异必须放第二参，避免与内容对象混淆。
  source.derive({ states: { hover: 2 } })
  source.derive(2, name => `next-${name}`)
  source.derive({ toCSSString: () => '2px' }, { name: 'content-object' })
  // @ts-expect-error 创建入口不再接收继承配置。
  variable({ derive: source })
  // @ts-expect-error 默认生产函数无参数绑定，规则参数由外层普通函数接收。
  variable((base: ValueInput) => base, 'bound-default')
}
