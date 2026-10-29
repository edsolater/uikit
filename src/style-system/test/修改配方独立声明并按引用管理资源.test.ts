/** Modification 独立声明、共享配方、撤销和领域校验的实际行为。 */
import { expect, test, vi } from 'vitest'
import { compileRules } from '../css-root'
import { token } from '../token'
import { key } from '../key'
import { declare } from '../operations/declare'
import { modify } from '../operations/modify'
import { modification } from '../modification'
import { add } from '../pieces/functions/calc'

test('配方可以独立声明与引用，未指定通道保留来源且 alpha=0 不丢失', () => {
  const recipe = modification({
    name: 'independent-recipe',
    type: 'color',
    detail: { lightness: 0.3, alpha: 0 },
  })
  const css = compileRules([
    [['.Recipe'], ...declare(recipe)],
    [['.Reference'], key('--recipe-reference'), recipe],
  ])
  expect(css).toContain('--independent-recipe: 0.3 c h / 0;')
  expect(css).toContain('--recipe-reference: var(--independent-recipe);')
  expect(
    compileRules([
      [
        ['.KeepAlpha'],
        ...declare(
          modification({
            name: 'keep-recipe-alpha',
            type: 'color',
            detail: {},
          }),
        ),
      ],
    ]),
  ).toContain('--keep-recipe-alpha: l c h / alpha;')
})

test.each([false, true])(
  '双来源共享配方的扫描资源，最后消费者撤销=%s',
  (removeAll) => {
    const recipe = Object.assign(
      modification({
        name: 'shared-recipe',
        type: 'color',
        detail: { alpha: 0.5 },
      }),
      {
        onFirstScan: () =>
          [
            [['.SharedRecipeResource'], 'opacity', 0.3],
          ] as import('../rule').Rules,
      },
    )
    const first = token('red', 'recipe-first-source'),
      second = token('blue', 'recipe-second-source')
    const firstChange = modify(first, recipe),
      secondChange = modify(second, recipe)
    const css = compileRules([
      [['.First'], ...firstChange],
      [['.Second'], ...secondChange],
      [
        [],
        'order',
        token(1, {
          compileWaveIndex: 2,
          onCompile(_context, ast) {
            for (const change of removeAll
              ? [firstChange, secondChange]
              : [firstChange]) {
              const node = ast
                .search({})
                .find((node) => node.content === change[1])
              if (node) ast.remove(node)
            }
          },
        }),
      ],
    ])
    expect(css.includes('--shared-recipe:')).toBe(!removeAll)
    expect(css.includes('.SharedRecipeResource')).toBe(!removeAll)
  },
)

test('配方通道回调延迟到消费，采用当前闭包且未指定 alpha 保留表达式', () => {
  let delta = 0.1
  const chroma = vi.fn((current) => add(current, delta))
  const recipe = modification({
    name: 'lazy-recipe',
    type: 'color',
    detail: { chroma },
  })
  expect(chroma).not.toHaveBeenCalled()
  delta = 0.2
  const css = compileRules([[['.LazyRecipe'], ...declare(recipe)]])
  expect(css).toContain('--lazy-recipe: l calc(c + 0.2) h / alpha;')
})

test('未知内容领域和非法 detail 明确拒绝', () => {
  for (const type of ['unknown', 'constructor', 'toString', '__proto__']) {
    expect(() => modification({ type, detail: {} } as never)).toThrow(
      '尚未支持内容领域',
    )
  }
  expect(() =>
    modification({ type: 'color', detail: undefined } as never),
  ).toThrow('detail')
})
