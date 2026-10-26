/** 内容协议按能力识别，Token 的直接内容和引用共享消费过程。 */
import { expect, test } from 'vitest'
import {
  hasJSSContentOutput,
  hasJSSContentOnCompileMethod,
  isJSSContent,
} from './content'
import { compileRules } from './css-root'
import { token } from './token'

test('继承的方法和可调用内容对象保留协议，不执行函数体', () => {
  const inherited = Object.create({
    onCompile: (context, ast) => ast.setContent(context, '3px'),
  })
  const callable = Object.assign(
    () => {
      throw new Error('内容对象不能作为生产函数调用')
    },
    { toCSSString: () => '4px' },
  )
  expect(hasJSSContentOnCompileMethod(inherited)).toBe(true)
  expect(hasJSSContentOutput(callable)).toBe(true)
  const css = compileRules([
    [['.Inherited'], 'width', token(inherited)],
    [['.Callable'], 'height', token(callable)],
  ])
  expect(css).toContain('width: 3px;')
  expect(css).toContain('height: 4px;')
})

test('只有符合协议的字段标识内容，缺失或非法方法不冒充协议', () => {
  expect(isJSSContent({ dependencies: [] })).toBe(true)
  expect(isJSSContent({ onFirstScan: () => [] })).toBe(true)
  expect(hasJSSContentOnCompileMethod({ onCompile: undefined })).toBe(false)
  expect(hasJSSContentOutput({ toCSSString: 'css' })).toBe(false)
  expect(isJSSContent({ dependencies: null, onFirstScan: false })).toBe(false)
  expect(isJSSContent(null)).toBe(false)
  expect(isJSSContent(undefined)).toBe(false)
})
