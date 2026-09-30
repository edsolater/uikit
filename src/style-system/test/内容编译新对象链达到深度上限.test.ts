import { describe, expect, it } from 'vitest'
import { compileRules } from '../css-root'

describe('Content 次波终止', () => {
  it('新对象持续生成待编译对象时，在调用栈溢出前以深度上限失败', () => {
    const createCompilable = (): { compile(): ReturnType<typeof createCompilable> } => ({
      compile: createCompilable,
    })

    expect(() => compileRules([[undefined, 'color', createCompilable()]]))
      .toThrow('Content 编译嵌套超过上限 256，编译无法终止。')
  })
})
