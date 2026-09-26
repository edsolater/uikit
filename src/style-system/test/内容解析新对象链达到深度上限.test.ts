import { describe, expect, it } from 'vitest'
import { compileRules } from '../css-root'

describe('Content 次波终止', () => {
  it('新对象持续生成解析对象时，在调用栈溢出前以深度上限失败', () => {
    const createParseable = (): { parse(): ReturnType<typeof createParseable> } => ({
      parse: createParseable,
    })

    expect(() => compileRules([[undefined, 'color', createParseable()]]))
      .toThrow('Content 解析嵌套超过上限 256，解析无法终止。')
  })
})
