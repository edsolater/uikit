/** 验证 CSS 字符串输出保持 JSS 内容节点的原始队列顺序。 */
import { expect, test, vi } from 'vitest'
import { condition } from '../condition'
import { contentNodesToCSSString } from '../compiler/content-nodes-to-css-string'
import { rulesToStyleNodes } from '../compiler/rules-to-style-nodes'
import { styleNodesToContentNodes } from '../compiler/style-nodes-to-content-nodes'
import { createJSSContent } from '../content'
import type { Rules } from '../rule'

test('解析完成仍保留内容对象，到最终输出才读取 CSS 文本', () => {
  const output = vi.fn(() => 'red')
  const content = createJSSContent(output)
  const sourceRules: Rules = [[[condition('.A')], 'color', content]]
  const nodes = styleNodesToContentNodes(rulesToStyleNodes(sourceRules), sourceRules)

  expect(nodes[0].content).toBe(content)
  expect(output).not.toHaveBeenCalled()
  expect(contentNodesToCSSString(nodes)).toBe('.A {\ncolor: red;\n}')
  expect(output).toHaveBeenCalledOnce()
})

test('跨地址交错的节点不为合并地址而重排', () => {
  const resolvedContents = new WeakMap<object, unknown>()
  const css = contentNodesToCSSString([
    { conditionPath: [condition('.A')], key: '--a', content: '1', resolvedContents },
    { conditionPath: [condition('.B')], key: 'color', content: 'red', resolvedContents },
    { conditionPath: [condition('.A')], key: '--b', content: '2', resolvedContents },
  ])

  expect(css).toBe([
    '.A {',
    '--a: 1;',
    '}',
    '.B {',
    'color: red;',
    '}',
    '.A {',
    '--b: 2;',
    '}',
  ].join('\n'))
})
