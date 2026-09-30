import { expect, test } from 'vitest'
import { hasJSSContentOutput, hasJSSContentCompileMethod, isJSSContent } from './content'

test('继承的内容方法和可调用内容保留其行为', () => {
  const inherited = Object.create({ compile: () => 'compiled' })
  const callable = Object.assign(() => 'value', { toCSSString: () => 'css' })

  expect(hasJSSContentCompileMethod(inherited)).toBe(true)
  expect(isJSSContent(inherited)).toBe(true)
  expect(hasJSSContentOutput(callable)).toBe(true)
  expect(isJSSContent(callable)).toBe(true)
})

test('只有符合内容协议的属性才标识内容', () => {
  expect(isJSSContent({ dependencies: [] })).toBe(true)
  expect(isJSSContent({ contents: [] })).toBe(false)
  expect(isJSSContent({ onActive: () => undefined })).toBe(true)
  expect(hasJSSContentCompileMethod({ compile: undefined })).toBe(false)
  expect(hasJSSContentOutput({ toCSSString: 'css' })).toBe(false)
  expect(isJSSContent({ dependencies: null, onActive: false })).toBe(false)
  expect(isJSSContent(null)).toBe(false)
  expect(isJSSContent(undefined)).toBe(false)
})
