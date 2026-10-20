import { expect, test } from 'vitest'
import type { JSSContent } from '../../content'
import { compileRules } from '../../css-root'
import type { JSSKeyObject } from '../../key'
import type { Rules } from '../../rule'

test.each([false, true])('消费内容更换后旧资源仅在最后一个消费者退出时撤销，共享=%s', shared => {
  const old: JSSContent = {
    toCSSString: () => '1px',
    onActive: () => [[['.OldResource'], 'opacity', 0.5]],
  }
  const next: JSSContent = {
    toCSSString: () => '2px',
    onActive: () => [[['.NewResource'], 'opacity', 0.8]],
  }
  let changed = false
  const rules: Rules = [[['.Consumer'], 'width', old]]
  if (shared) rules.push([['.SharedConsumer'], 'height', old])
  rules.push([[], undefined, { onCompile(_context, ast) {
    ast.addSettlementCheck(() => {
      if (changed) return false
      changed = true
      ast.search({ key: 'width' })[0].content = next
      return true
    })
  } }])

  const css = compileRules(rules)
  expect(css).toContain('width: 2px;')
  expect(css).toContain('.NewResource')
  expect(css.includes('.OldResource')).toBe(shared)
  if (shared) expect(css).toContain('height: 1px;')
})

test('同一声明的Key仍消费资源时，更换Content保留Key需要的资源', () => {
  const source: JSSKeyObject & JSSContent = {
    toCSSString: () => 'width',
    onCompile() {},
    onActive: () => [[['.KeyResource'], 'opacity', 0.5]],
  }
  let changed = false
  const css = compileRules([
    [['.Consumer'], source, source],
    [[], undefined, { onCompile(_context, ast) {
      ast.addSettlementCheck(() => {
        if (changed) return false
        changed = true
        ast.search({ key: source })[0].content = '2px'
        return true
      })
    } }],
  ])
  expect(css).toContain('width: 2px;')
  expect(css).toContain('.KeyResource')
})
