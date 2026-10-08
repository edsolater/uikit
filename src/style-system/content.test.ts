/** 内容协议的类型边界验证。
 *
 * 验证广义内容识别与 Expression 的窄边界，纯 Value 替换后仍保持内容契约。
 *
 * 防止广义内容被无阻碍地当作 JSS 内容组织工具的产物。
 */
import { expect, expectTypeOf, test } from 'vitest'
import { createJSSContent, hasJSSContentOutput, hasJSSContentOnCompileMethod, isJSSContent, type Expression, type JSSContent } from './content'
import { value, type ValueOptions } from './value'
import { variable } from './variable'
import { cssFunction } from './css-function'
import { modification, type Modification } from './modification'
import { colorVariableModification } from './color-variable-modification'
import { oklch } from './pieces/contents/functions/oklch'

test('继承的内容方法和可调用内容保留其行为', () => {
  const inherited = Object.create({ onCompile: (context, controller) => { controller.setContent(context, 'compiled') } })
  const callable = Object.assign(() => 'value', { toCSSString: () => 'css' })

  expect(hasJSSContentOnCompileMethod(inherited)).toBe(true)
  expect(isJSSContent(inherited)).toBe(true)
  expect(hasJSSContentOutput(callable)).toBe(true)
  expect(isJSSContent(callable)).toBe(true)
})

test('只有符合内容协议的属性才标识内容', () => {
  expect(isJSSContent({ dependencies: [] })).toBe(true)
  expect(isJSSContent({ contents: [] })).toBe(false)
  expect(isJSSContent({ onActive: () => undefined })).toBe(true)
  expect(hasJSSContentOnCompileMethod({ onCompile: undefined })).toBe(false)
  expect(hasJSSContentOutput({ toCSSString: 'css' })).toBe(false)
  expect(isJSSContent({ dependencies: null, onActive: false })).toBe(false)
  expect(isJSSContent(null)).toBe(false)
  expect(isJSSContent(undefined)).toBe(false)
})

test('广义内容和定义主体不属于Expression，其输出表达式属于Expression', () => {
  expectTypeOf<JSSContent>().not.toExtend<Expression>()
  expectTypeOf<Required<Pick<JSSContent, 'dependencies' | 'toCSSString' | 'onCompile'>>>().not.toExtend<Expression>()
  expectTypeOf(variable(3)).not.toExtend<Expression>()
  expectTypeOf(colorVariableModification()).not.toExtend<Expression>()
  expectTypeOf<Modification<unknown>>().not.toExtend<JSSContent>()
  expectTypeOf(colorVariableModification()).toExtend<JSSContent>()
  if (false) {
    // @ts-expect-error 表达式变化规则没有独立内容输出，不能作为 Variable 的默认内容。
    variable(modification(() => value(3)))
  }
  const custom = cssFunction('--identity(--n <number>)', [[[], 'result', 'var(--n)']])
  expectTypeOf(custom).not.toExtend<Expression>()
  expectTypeOf(custom(3)).toExtend<Expression>()
  expectTypeOf(createJSSContent(() => '3')).toExtend<Expression>()
})

test('纯Value与OKLCH替换内容后保持Expression，宽选项保留广义内容契约', () => {
  const plain = value<number>(3)
  expectTypeOf(plain.withContent(4)).toExtend<Expression>()
  const color = oklch({ lightness: 0.6, chroma: 0.1, hue: 240 })
  expectTypeOf(color.withContent({ lightness: 0.5, chroma: 0.1, hue: 240 })).toExtend<Expression>()
  const options: ValueOptions<number> = {}
  expectTypeOf(value(3, options)).not.toExtend<Expression>()
  const optionalOptions: ValueOptions<number> | undefined = options.onActive ? options : undefined
  expectTypeOf(value(3, optionalOptions)).not.toExtend<Expression>()
  expectTypeOf(value(3, { onActive: () => [] })).not.toExtend<Expression>()
  expectTypeOf(value(3, { toCSSString: current => String(current) })).toExtend<Expression>()
})
