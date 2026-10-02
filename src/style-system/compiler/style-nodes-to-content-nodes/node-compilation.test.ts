/** 内容通知与位置操作的契约验证。
 *
 * 区分通知返回值、自身输出及显式内容操作，并检查跨波等待。
 *
 * 防止恢复旧返回协议或在重试时撤销已经生效的操作。
 */
import { expect, test, vi } from 'vitest'
import { compileRules } from '../../css-root'
import { value } from '../../value'
import type { JSSCompileContext, JSSContent } from '../../content'
import type { ASTController } from '../ast-controller'

test('通知返回值不参与编译，自身输出保留而显式 undefined 抑制输出，旧上下文不能继续操作', () => {
  const unexpected = vi.fn()
  const output = vi.fn(() => 'self')
  const hidden = vi.fn(() => 'hidden')
  let context: JSSCompileContext
  let controller: ASTController
  const content: JSSContent = {
    onCompile(current, ast) {
      context = current
      controller = ast
      return { onCompile: unexpected, toCSSString: () => 'returned' }
    },
    toCSSString: output,
  }
  const suppressed: JSSContent = {
    onCompile(current, ast) { ast.setContent(current, undefined) },
    toCSSString: hidden,
  }
  expect(compileRules([[[], 'width', content], [[], 'height', suppressed]])).toBe('width: self;')
  expect(unexpected).not.toHaveBeenCalled()
  expect(output).toHaveBeenCalledOnce()
  expect(hidden).not.toHaveBeenCalled()
  expect(() => controller.setContent(context, 'stale')).toThrow('当前通知')
})

test('暂缓不撤回已设置内容，嵌套前序通知与插入只执行一次', () => {
  let ready = false
  let attempts = 0
  const producer = vi.fn((context: JSSCompileContext, controller: ASTController) => {
    controller.insert({ before: context.node, conditionPath: context.conditionPath }, ['--once', 7], { owner: context.node })
  })
  const waiting: JSSContent = {
    onCompile(context, controller) {
      attempts++
      if (!ready) {
        controller.setContent(context, '1px')
        controller.defer(context.node, '等待前提')
      }
    },
  }
  const activate: JSSContent = { onCompile() { ready = true } }
  const css = compileRules([[[], 'width', value([{ onCompile: producer }, waiting])], [[], 'order', activate]])
  expect(css).toContain('width: 1px;')
  expect(css.match(/--once: 7;/g)).toHaveLength(1)
  expect(producer).toHaveBeenCalledOnce()
  expect(attempts).toBe(2)
})
