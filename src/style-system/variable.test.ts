/** Variable 匿名创建与内容编译的验证。

检查省略名称后仍获得可消费的 CSS 变量及状态声明。

确保临时名称已经在入口确定，编译时继续使用同一个名称。
*/
import { expect, test } from 'vitest'
import { variable } from './variable'
import { condition } from './condition'
import { compileRules } from './css-root'

test('省略配置或配置内名称时都能创建并编译 Variable', () => {
  const amount = variable(1)
  const stateful = variable({ default: 2, hover: 3 }, { states: { active: 4 } })
  expect(amount.name).toMatch(/^temp-\d+$/)
  expect(stateful.name).toMatch(/^temp-\d+$/)
  expect(stateful.name).not.toBe(amount.name)
  const css = compileRules([[[condition('.Anonymous')], 'opacity', stateful]])
  expect(css).toContain(`--${stateful.name}: 2;`)
  expect(css).toContain(`--${stateful.name}: 3;`)
  expect(css).toContain(`--${stateful.name}: 4;`)
  expect(css).toContain(`opacity: var(--${stateful.name}, 2);`)
  expect(amount.toCSSString()).toBe(`--${amount.name}`)
})
