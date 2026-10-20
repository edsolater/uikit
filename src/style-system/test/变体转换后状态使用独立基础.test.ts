/** 验证变体转换、原样继承及单层选择产生的实际样式。 */
import { expect, test } from 'vitest'
import { compileRules } from '../css-root'
import { variable, variableFrom, variableName } from '../variable'
import type { ValueInput } from '../value'
import { multiply, add } from '../pieces/contents/functions/calc'

const twice = (base: ValueInput) => typeof base === 'number' ? base * 2 : multiply(base, 2)
const plusThree = (base: ValueInput) => typeof base === 'number' ? base + 3 : add(base, 3)

test('所有Variable都能派生，规则与固定值原样复用，变体结果仍能派生', () => {
  const source = variable(10, {
    name: 'variant-inherited',
    states: { hover: plusThree, active: 99 },
    variants: { scaled: twice, fixed: 7, zero: 0 },
  })
  const changed = variableFrom(source, 20, { name: 'variant-inherited-next', variants: { fixed: 8 } })
  const scaled = changed.variant('scaled')
  const fixed = changed.variant('fixed')
  const zero = changed.variant('zero')
  const again = variableFrom(fixed, 30, 'variant-fixed-next')
  const plain = variableFrom(variable(5, 'variant-plain'), 8, 'variant-plain-next')
  const css = compileRules([
    [['.Scaled'], 'z-index', scaled], [['.Fixed'], 'z-index', fixed],
    [['.Zero'], 'z-index', zero], [['.Again'], 'z-index', again], [['.Plain'], 'z-index', plain],
    [['.SourceFixed'], 'z-index', source.variant('fixed')],
  ])
  expect(css).toMatch(/--variant-inherited-next-scaled:\s*40\s*;/)
  expect(css).toMatch(/--variant-inherited-next-scaled:\s*43\s*;/)
  expect(css).toMatch(/--variant-inherited-next-fixed:\s*8\s*;/)
  expect(css).toMatch(/--variant-inherited-next-fixed:\s*11\s*;/)
  expect(css).toMatch(/--variant-inherited-fixed:\s*7\s*;/)
  expect(css).toMatch(/--variant-inherited-next-fixed:\s*99\s*;/)
  expect(css).toMatch(/--variant-inherited-next-zero:\s*0\s*;/)
  expect(css).toMatch(/--variant-fixed-next:\s*30\s*;/)
  expect(css).toMatch(/--variant-fixed-next:\s*33\s*;/)
  expect(css).toMatch(/--variant-fixed-next:\s*99\s*;/)
  expect(css).toMatch(/--variant-plain-next:\s*8\s*;/)
})

test('正控制：普通Variable能编译转换后的基础与重新绑定的状态', () => {
  const content = variable(twice(10), { name: 'variant-control', states: { hover: plusThree } })
  const css = compileRules([[['.Control'], 'width', content]])
  expect(css).toMatch(/--[\w-]+:\s*20\s*;/)
  expect(css).toMatch(/--[\w-]+:\s*23\s*;/)
})

test('变体返回可消费Variable并使用后缀名称，状态作用于转换后的基础', () => {
  const surface = variable(10, { name: 'variant-surface', states: { hover: plusThree, active: 99 }, variants: { content: twice } })
  const content = surface.variant('content')
  const css = compileRules([[['.Button'], 'width', content]])
  expect(String(content.name)).toBe('variant-surface-content')
  expect(css).toMatch(/--variant-surface-content:\s*99\s*;/)
  expect(css).toMatch(/--[\w-]+:\s*20\s*;/)
  expect(css).toMatch(/--[\w-]+:\s*23\s*;/)
  expect(css).not.toMatch(/--[\w-]+:\s*26\s*;/)
})

test('选择变体后不能再取得来源变体，再次派生也不找回来源定义', () => {
  const surface = variable(10, { name: 'variant-one-level', variants: { content: twice, line: base => add(base, 1) } })
  const content = surface.variant('content')
  expect(() => content.variant('line')).toThrow()
  expect(() => variableFrom(content, 30, 'variant-result-next').variant('line')).toThrow()
  expect(compileRules([[['.Content'], 'width', content]])).toMatch(/--[\w-]+:\s*20\s*;/)
})

test('literal变体不补造母体引用，同名与纯Name不带回定义', () => {
  const source = variable(10, { name: 'variant-literal-parent', variants: { content: twice } })
  const content = source.variant('content')
  const unrelated = variable('red', String(content.name))
  const css = compileRules([[['.Literal'], 'width', content], [['.NameOnly'], 'height', variableName(String(unrelated.name))]])
  expect(css).toMatch(/--[\w-]+:\s*20\s*;/)
  expect(css).not.toContain('var(--variant-literal-parent)')
  expect(css).not.toMatch(/--variant-literal-parent\s*:/)
  expect(css).not.toContain('red')
  expect(String(variableName('variant-address-only'))).toBe('variant-address-only')
})

test('表达式中的真实Variable引用仍进入变体依赖', () => {
  const shared = variable(7, 'variant-shared-input')
  const surface = variable(shared, { name: 'variant-reference-parent', variants: { content: twice } })
  const css = compileRules([[['.Shared'], 'width', surface.variant('content')]])
  expect(css).toContain('--variant-shared-input: 7;')
  expect(css).toContain('var(--variant-shared-input)')
  expect(css).not.toContain('var(--variant-reference-parent)')
})
