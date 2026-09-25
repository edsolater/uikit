/** 验证 CSS 字符串输出保持 parsed 语义节点的原始队列顺序。 */
import { expect, test } from 'vitest'
import { condition } from '../condition'
import { toCSSString } from '../compiler/css-string'

test('跨地址交错的节点不为合并地址而重排', () => {
  const css = toCSSString([
    { conditionPath: [condition('.A')], key: '--a', value: '1' },
    { conditionPath: [condition('.B')], key: 'color', value: 'red' },
    { conditionPath: [condition('.A')], key: '--b', value: '2' },
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
