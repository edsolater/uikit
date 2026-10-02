/** 编译通知持续生成新内容时，深度限制仍保证可控终止。 */
import { describe, expect, it } from 'vitest'
import { compileRules } from '../css-root'
import type { JSSContent } from '../content'

describe('Content 次波终止', () => {
  it('新对象持续生成待编译对象时，在调用栈溢出前以深度上限失败', () => {
    const createCompilable = (): JSSContent => ({
      onCompile(context, controller) { controller.setContent(context, createCompilable()) },
    })

    expect(() => compileRules([[undefined, 'color', createCompilable()]]))
      .toThrow('Content 编译嵌套超过上限 256，编译无法终止。')
  })
})
