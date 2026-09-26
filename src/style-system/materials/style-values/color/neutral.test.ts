/** 验证中性色阶 Cluster 的成员身份、命名与内容组合。 */
import { expect, test } from 'vitest'
import { compileCSS } from '../../../index'
import { neutralColor } from './neutral'

test('default 与数字零指向同一成员，其余数字返回各自声明的 Variable', () => {
  const before = compileCSS()
  expect(neutralColor.name).toBe(neutralColor(0).name)
  for (let level = 0; level <= 8; level++) {
    const color = neutralColor(level as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8)
    expect(color.kind).toBe('variable')
    expect(color.name).toBe(`neutral-color-${level}`)
  }
  expect(compileCSS()).toBe(before)
})

test('未声明成员在类型与运行时均不成为另一套色阶查询协议', () => {
  // @ts-expect-error Cluster 只接受实际声明的成员键。
  expect(() => neutralColor('missing')).toThrow()
  // @ts-expect-error Cluster 不把已声明的数字成员宽化为任意 number。
  expect(() => neutralColor(9)).toThrow()
  expect(neutralColor.name).toBe('neutral-color-0')
})
