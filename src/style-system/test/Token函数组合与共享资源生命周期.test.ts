/** 组合只沿实际内容引用保留资源，最后一个消费者退出时撤销。 */
import { expect, test } from 'vitest'
import { token, type Token } from '../token'
import { compileRules } from '../css-root'
import { multiply } from '../pieces/functions/calc'
import type { Rules } from '../rule'

test.each([false, true])(
  '普通函数返回的多个 Token 共享来源资源，全部撤销=%s',
  (removeAll) => {
    const source = token(2, {
      name: 'function-resource-source',
      registration: { syntax: '<number>', inherits: false, initialValue: 1 },
      onFirstScan: () => [[['.FunctionResource'], 'opacity', 0.5]],
    })
    const scale = (factor: number) => token(multiply(source, factor))
    const first = scale(2),
      second = scale(3)
    const css = compileRules([
      [['.First'], 'z-index', first],
      [['.Second'], 'order', second],
      [
        [],
        'opacity',
        token(1, {
          compileWaveIndex: 2,
          onCompile(_context, ast) {
            for (const target of removeAll ? [first, second] : [first]) {
              const node = ast
                .search({})
                .find((node) => node.content === target)
              if (node) ast.remove(node)
            }
          },
        }),
      ],
    ])
    expect(css.includes('.FunctionResource')).toBe(!removeAll)
    expect(css.includes('@property --function-resource-source')).toBe(
      !removeAll,
    )
  },
)

test('同址资源的后一个来源撤销后，仍消费前一个来源的资源值', () => {
  const old = {
    toCSSString: () => '1px',
    onFirstScan: (): Rules => [[['.Resource'], 'opacity', 0.5]],
  }
  const next = {
    toCSSString: () => '2px',
    onFirstScan: (): Rules => [[['.Resource'], 'opacity', 0.8]],
  }
  const css = compileRules([
    [['.A'], 'width', old],
    [['.B'], 'height', next],
    [
      [],
      undefined,
      {
        onCompile(_context, ast) {
          ast.remove(ast.search({ key: 'height' })[0])
        },
      },
    ],
  ])
  expect(css).toMatch(/\.A\s*\{\s*width: 1px;/)
  expect(css).not.toContain('height:')
  expect(css).toMatch(/\.Resource\s*\{\s*opacity: 0.5;/)
  expect(css).not.toContain('opacity: 0.8;')
})

test('组合可以显式继承、替换或清除扫描机会，不追踪函数创建历史', () => {
  const source = token('red', {
    onFirstScan: () => [[['.OriginalResource'], 'opacity', 0.3]],
  })
  const inherited = token(source.default, { onFirstScan: source.onFirstScan })
  const replaced = token(source.default, {
    onFirstScan: () => [[['.ReplacementResource'], 'opacity', 0.6]],
  })
  const cleared = token(source.default)
  expect(compileRules([[['.Inherited'], 'color', inherited]])).toContain(
    '.OriginalResource',
  )
  const replacedCSS = compileRules([[['.Replaced'], 'color', replaced]])
  expect(replacedCSS).toContain('.ReplacementResource')
  expect(replacedCSS).not.toContain('.OriginalResource')
  expect(compileRules([[['.Cleared'], 'color', cleared]])).not.toContain(
    'Resource',
  )
})

test('没有实际引用的 Token 不发布扫描规则或注册，CSS 名称不反查定义', () => {
  token(2, {
    name: 'unused-resource',
    registration: { syntax: '<number>', inherits: true, initialValue: 0 },
    onFirstScan() {
      throw new Error('未消费的资源不应执行')
    },
  })
  expect(
    compileRules([[['.Unrelated'], 'z-index', 'var(--unused-resource, 1)']]),
  ).not.toContain('@property')
})
