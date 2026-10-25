/** Variable 显式命名，以及 variableFrom 创建时的公开参数契约。 */
import { expect, test } from 'vitest'
import { variable, variableFrom, mapVariableRules } from './core'
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
  // @ts-expect-error 普通创建不能省略内容。
  variable({ name: 'missing-default' })
  const source = variable(1, 'typed-extended-source')
  // 复制定义可只指定差异；替换基础内容保留独立入口。
  variableFrom(source, source.content)
  // @ts-expect-error variableFrom 至少提供配置对象或基础内容。
  variableFrom(source)
  // @ts-expect-error derive 已由 variableFrom 替代，不保留兼容入口。
  source.derive(2)
  variableFrom(source, 2, {})
  mapVariableRules(source, current => current)
  mapVariableRules(source, current => current, { name: undefined, registration: undefined })
  // @ts-expect-error 名称在注册时绑定，不能在之后赋入字符串改名。
  source.name = 'renamed-after-registration'
  variableFrom(source, source.content, { states: { hover: 2 }, priority: 0 })
  variableFrom(source, { states: { hover: 2 } })
  variableFrom(source, {})
  variableFrom(source, 2, name => `next-${name}`)
  variableFrom(source, { toCSSString: () => '2px' }, { name: 'content-object' })
  // @ts-expect-error 创建入口不再接收继承配置。
  variable({ derive: source })
  // @ts-expect-error 默认生产函数无参数绑定，规则参数由外层普通函数接收。
  variable((base: ValueInput) => base, 'bound-default')
}
