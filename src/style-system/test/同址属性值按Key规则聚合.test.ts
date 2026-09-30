/** 验证同址重复声明、Key 聚合规则和编译结果的来源关系。 */
import { expect, test } from 'vitest'
import { condition } from '../condition'
import { compileCSS, compileRules } from '../css-root'
import { key } from '../key'
import { valueList } from '../pieces/contents/atom-creators/list'
import { $boxShadow } from '../pieces/keys/box-shadow'
import { stateCondition } from '../pieces/state-conditions'
import { rule, rules } from '../rule'
import { arraySequenceToCSSString, value, type Value } from '../value'
import type { JSSCompileContext } from '../content'
import type { ASTController } from '../compiler/ast-controller'
import type { Rules } from '../rule'

stateCondition('aggregateHover', condition('&:where([data-aggregate-hover])'))
stateCondition('aggregateFocus', condition('&:where([data-aggregate-focus])'))

test('阴影层与已有完整列表按声明顺序保留重复项，结果落在最后声明的位置', () => {
  const css = compileRules([
    [[condition('.Shadow')], $boxShadow, '1px 2px red'],
    [[condition('.Other')], 'color', 'red'],
    [[condition('.Shadow')], 'background', 'blue'],
    [[condition('.Shadow')], $boxShadow, '3px 4px blue, 5px 6px green'],
    [[condition('.Shadow')], $boxShadow, '1px 2px red'],
  ])
  expect(css).toBe([
    '.Other {',
    'color: red;',
    '}',
    '.Shadow {',
    'background: blue;',
    'box-shadow: 1px 2px red, 3px 4px blue, 5px 6px green, 1px 2px red;',
    '}',
  ].join('\n'))
})

test('聚合按属性名与最终目标状态地址隔离，同名对象可共享同一规则', () => {
  const join = (items: Value[]) => items.reduce((sum, item) => sum + Number(item.content), 0)
  const first = key('--aggregate-sum', { join })
  const second = key('--aggregate-sum', { join })
  const css = compileRules([
    [[condition('.A')], first, 2],
    [[condition('.A'), 'aggregateHover'], second, 7],
    [[condition('.B')], second, 11],
    [[condition('.A')], second, 3],
    [[condition('.A'), 'aggregateHover'], first, 5],
  ])
  expect(css).toContain('.A {\n--aggregate-sum: 5;')
  expect(css).toContain('.B {\n--aggregate-sum: 11;\n}')
  expect(css).toContain('--aggregate-sum: 12;')
  expect(css).not.toContain('--aggregate-sum: 2;')
})

test('同组状态输入顺序不同仍汇入规范化的同一地址', () => {
  const css = compileRules([
    [[condition('.Normalized'), 'aggregateHover', 'aggregateFocus'], $boxShadow, '1px 2px red'],
    [[condition('.Normalized'), 'aggregateFocus', 'aggregateHover'], $boxShadow, '3px 4px blue'],
  ])
  expect(css).toContain('box-shadow: 1px 2px red, 3px 4px blue;')
  expect(css.match(/box-shadow:/g)).toHaveLength(1)
})

test('无专属规则的对象 Key 与字符串 Key 按属性名默认组合，单项原样输出', () => {
  const plain = key('width')
  const css = compileRules([
    [[condition('.Default')], plain, '2px'],
    [[condition('.Default')], 'width', '3px'],
    [[condition('.Default')], key('height'), '4px'],
  ])
  expect(css).toContain('width: 2px, 3px;')
  expect(css.match(/width:/g)).toHaveLength(1)
  expect(css).toContain('height: 4px;')
})

test('聚合规则同时取得原对象身份与各项独立的解析读取结果', () => {
  const firstContent = { onCompile: () => '2px' }
  const secondContent = { onCompile: () => '3px' }
  const observed: unknown[] = []
  const spacing = key('--aggregate-spacing', {
    join(items) {
      observed.push(...items.map((item) => item.content))
      return value(items, { toCSSString: arraySequenceToCSSString })
    },
  })
  const css = compileRules([
    [[condition('.Resolved')], spacing, firstContent],
    [[condition('.Resolved')], spacing, secondContent],
  ])
  expect(observed[0]).toBe(firstContent)
  expect(observed[1]).toBe(secondContent)
  expect(css).toContain('--aggregate-spacing: 2px 3px;')
})

test('同一原对象在两个声明位置分别解析，Value 仍保留同一身份且不重复激活', () => {
  let compiles = 0
  let activations = 0
  const shared = {
    onActive: () => { activations++; return [] },
    onCompile: () => `${++compiles}px`,
  }
  const observed: Value[] = []
  const spacing = key('--shared-content-spacing', {
    join(items) {
      observed.push(...items)
      return value(items, { toCSSString: arraySequenceToCSSString })
    },
  })
  const css = compileRules([
    [[condition('.SharedContent')], spacing, shared],
    [[condition('.SharedContent')], spacing, shared],
  ])
  expect(observed[0].content).toBe(shared)
  expect(observed[1].content).toBe(shared)
  expect(observed[0]).not.toBe(observed[1])
  expect(compiles).toBe(2)
  expect(activations).toBe(1)
  expect(css).toContain('--shared-content-spacing: 1px 2px;')
})

test('聚合规则修改 Value 当前内容后按新值输出', () => {
  const replacement = key('--replace-value-content', {
    join(items) {
      items[0].content = '9px'
      return value(items, { toCSSString: arraySequenceToCSSString })
    },
  })
  const css = compileRules([
    [[condition('.ReplaceValue')], replacement, '1px'],
    [[condition('.ReplaceValue')], replacement, '2px'],
  ])
  expect(css).toContain('--replace-value-content: 9px 2px;')
})

test('聚合规则把 Value 当前内容改成数组时仍按 Value 默认规则输出', () => {
  const replacement = key('--replace-value-array', {
    join(items) {
      items[0].content = [0, false]
      return value(items)
    },
  })
  const css = compileRules([
    [[condition('.ReplaceArray')], replacement, 'old'],
    [[condition('.ReplaceArray')], replacement, 'tail'],
  ])
  expect(css).toContain('--replace-value-array: 0, false, tail;')
})

test('join 修改 Value 内容为新解析对象时沿结果节点解析与激活', () => {
  let compiles = 0
  let activations = 0
  const child = {
    onActive: () => { activations++; return [] },
    onCompile: () => { compiles++; return 'new' },
  }
  const target = key('--replace-value-child', {
    join(items) {
      items[0].content = [child]
      return value(items)
    },
  })
  const css = compileRules([
    [[condition('.ReplaceChild')], target, 'old'],
    [[condition('.ReplaceChild')], target, 'tail'],
  ])
  expect(compiles).toBe(1)
  expect(activations).toBe(1)
  expect(css).toContain('--replace-value-child: new, tail;')
})

test('嵌套同一原对象在两个声明位置各自解析成数组 Value', () => {
  let compiles = 0
  let activations = 0
  const shared = {
    onActive: () => { activations++; return [] },
    onCompile: () => value([++compiles, false]),
  }
  const nested = value([[shared]])
  const observed: Value[] = []
  const target = key('--nested-shared', {
    join(items) {
      observed.push(...items)
      return value(items)
    },
  })
  const css = compileRules([
    [[condition('.NestedShared')], target, nested],
    [[condition('.NestedShared')], target, nested],
  ])
  expect(observed[0].content).toBe(nested)
  expect(observed[1].content).toBe(nested)
  expect(compiles).toBe(2)
  expect(activations).toBe(1)
  expect(css).toContain('--nested-shared: 1, false, 2, false;')
})

test('join 保留输入 Value 对象时继续使用各声明位置的编译结果', () => {
  let compiles = 0
  let activations = 0
  const shared = {
    onActive: () => { activations++; return [] },
    onCompile: () => String(++compiles),
  }
  const fresh = { onCompile: () => 'new' }
  const target = key('--retain-source-view', {
    join(items) { return value([valueList(items[0], fresh), items[1]]) },
  })
  const css = compileRules([
    [[condition('.RetainView')], target, shared],
    [[condition('.RetainView')], target, shared],
  ])
  expect(compiles).toBe(2)
  expect(activations).toBe(1)
  expect(css).toContain('--retain-source-view: 1, new, 2;')
})

test('第 2 波插入的同址声明参加聚合，原贡献的按需依赖仍保留', () => {
  const late = {
    compileWaveIndex: 2,
    onCompile(context: JSSCompileContext, controller: ASTController) {
      controller.insert({ before: context.node, conditionPath: context.conditionPath }, [$boxShadow, '3px 4px blue'], { owner: context.node })
      return '8px'
    },
  }
  const dependency: Rules = [[[condition(':where(:root)')], '--shadow-scale', '1']]
  const css = compileRules([
    [[condition('.Late')], $boxShadow, value('1px 2px red', { onActive: () => dependency })],
    [[condition('.Late')], 'width', late],
    [[condition('.Late')], $boxShadow, '5px 6px green'],
  ])
  expect(css).toContain('box-shadow: 1px 2px red, 3px 4px blue, 5px 6px green;')
  expect(css).toContain('--shadow-scale: 1;')
})

test('聚合产物返回待解析内容，新增同址贡献后重新收集全部原始输入', () => {
  let additions = 0
  const stacking = key('--aggregate-reentry', {
    join(items) {
      const originals = items.map((item) => item.content)
      return {
        onCompile(context: JSSCompileContext, controller: ASTController) {
          if (additions++ === 0) controller.insert({ conditionPath: context.conditionPath, after: context.node }, [stacking, 4], { owner: context.node })
          return originals.reduce<number>((sum, item) => sum + Number(item), 0)
        },
      }
    },
  })
  const css = compileRules([
    [[condition('.Reentry')], stacking, 2],
    [[condition('.Reentry')], stacking, 3],
  ])
  expect(css).toContain('--aggregate-reentry: 9;')
  expect(css.match(/--aggregate-reentry:/g)).toHaveLength(1)
  expect(additions).toBe(2)
})

test('聚合产物的 onActive 新增同址贡献时继续聚合到稳定结果', () => {
  let activated = false
  const active = key('--aggregate-active', {
    join(items) {
      return value(value(items, { toCSSString: arraySequenceToCSSString }), {
        onActive: () => {
          if (activated) return []
          activated = true
          return [[[condition('.ActiveResult')], active, 'c']]
        },
      })
    },
  })
  const css = compileRules([
    [[condition('.ActiveResult')], active, 'a'],
    [[condition('.ActiveResult')], active, 'b'],
  ])
  expect(css).toContain('--aggregate-active: a b c;')
  expect(css.match(/--aggregate-active:/g)).toHaveLength(1)
})

test('聚合产物改写或撤销旧来源后重新计算，不留下旧结果', () => {
  let rewrites = 0
  const sum = key('--aggregate-rewrite', {
    join(items) {
      return {
        onCompile(context: JSSCompileContext, controller: ASTController) {
          if (rewrites++ === 0) {
            const first = controller.search({ key: sum, conditionPath: context.conditionPath })[0]
            if (!first) throw new Error('没有找到聚合来源。')
            first.content = 7
            first.compileRevision++
          }
          return items.reduce<number>((total, item) => total + Number(item.content), 0)
        },
      }
    },
  })
  const css = compileRules([
    [[condition('.Rewrite')], sum, 2],
    [[condition('.Rewrite')], sum, 3],
  ])
  expect(css).toContain('--aggregate-rewrite: 10;')
  expect(css.match(/--aggregate-rewrite:/g)).toHaveLength(1)
  expect(rewrites).toBe(2)

  let removals = 0
  const removable = key('--aggregate-remove', {
    join(items) {
      return {
        onCompile(context: JSSCompileContext, controller: ASTController) {
          if (removals++ === 0) {
            const first = controller.search({ key: removable, conditionPath: context.conditionPath })[0]
            if (!first) throw new Error('没有找到聚合来源。')
            controller.remove(first)
          }
          return items.reduce<number>((total, item) => total + Number(item.content), 0)
        },
      }
    },
  })
  const removedCSS = compileRules([
    [[condition('.Remove')], removable, 2],
    [[condition('.Remove')], removable, 3],
  ])
  expect(removedCSS).toContain('--aggregate-remove: 3;')
  expect(removedCSS.match(/--aggregate-remove:/g)).toHaveLength(1)
  expect(removals).toBe(1)
})

test('同名声明中唯一显式规则接管默认 Key', () => {
  const join = (items: Value[]) => items.length
  const enabled = key('--mixed-aggregate', { join })
  const plain = key('--mixed-aggregate')
  expect(compileRules([
    [[condition('.Mixed')], enabled, 1],
    [[condition('.Mixed')], plain, 2],
  ])).toContain('--mixed-aggregate: 2;')
  expect(compileRules([
    [[condition('.Mixed')], plain, 1],
    [[condition('.Mixed')], enabled, 2],
  ])).toContain('--mixed-aggregate: 2;')
  expect(compileRules([[[condition('.Mixed')], plain, 1], [[condition('.Mixed')], plain, 2]]))
    .toContain('--mixed-aggregate: 1, 2;')
})

test('显式组合规则在结果解析中修改后重新计算', () => {
  let switched = false
  const target = key('--changed-combiner', {
    join: () => ({
      onCompile() {
        if (!switched) {
          switched = true
          target.join = (items) => value(items)
        }
        return 'old'
      },
    }),
  })
  const css = compileRules([
    [[condition('.ChangedCombiner')], target, 2],
    [[condition('.ChangedCombiner')], target, 3],
  ])
  expect(switched).toBe(true)
  expect(css).toContain('--changed-combiner: 2, 3;')
  expect(css.match(/--changed-combiner:/g)).toHaveLength(1)
})

test('同名声明提供不同聚合规则时拒绝猜测优先级', () => {
  const first = key('--different-aggregate', { join: (items) => items.length })
  const second = key('--different-aggregate', { join: (items) => items.length * 2 })
  expect(() => compileRules([
    [[condition('.Different')], first, 1],
    [[condition('.Different')], second, 2],
  ])).toThrow('组合规则冲突')
})

test('组合产物把来源改成同名默认 Key 后撤销旧结果并按默认规则重算', () => {
  const plain = key('--changed-aggregate-key')
  let changed = false
  const aggregating = key('--changed-aggregate-key', {
    join(items) {
      return {
        onCompile(context: JSSCompileContext, controller: ASTController) {
          if (!changed) {
            changed = true
            for (const node of controller.search({ key: aggregating })) {
              if (node.key === aggregating && typeof node.content === 'number') node.key = plain
            }
          }
          return items.length
        },
      }
    },
  })
  const css = compileRules([
    [[condition('.ChangedKey')], aggregating, 2],
    [[condition('.ChangedKey')], aggregating, 3],
  ])
  expect(css).toContain('--changed-aggregate-key: 2, 3;')
  expect(css.match(/--changed-aggregate-key:/g)).toHaveLength(1)
})

test('一个聚合结果被其他解析对象移除后，存活来源重新生成结果', () => {
  const second = key('--second-aggregate', { join: (items) => items.length })
  let removed = false
  const first = key('--first-aggregate', {
    join: () => ({
      onCompile(context: JSSCompileContext, controller: ASTController) {
        if (!removed) {
          const result = controller.search({ key: second }).find((node) => node.content === 2)
          if (result) { controller.remove(result); removed = true }
        }
        return 'first'
      },
    }),
  })
  const css = compileRules([
    [[condition('.RemovedProduct')], first, 'a'],
    [[condition('.RemovedProduct')], first, 'b'],
    [[condition('.RemovedProduct')], second, 'x'],
    [[condition('.RemovedProduct')], second, 'y'],
  ])
  expect(removed).toBe(true)
  expect(css).toContain('--first-aggregate: first;')
  expect(css).toContain('--second-aggregate: 2;')
  expect(css.match(/--second-aggregate:/g)).toHaveLength(1)
})

test('聚合后的来源跨过其他属性移动，结果仍紧跟最后来源', () => {
  let moved = false
  const moving = key('--moving-aggregate', {
    join(items) {
      return {
        onCompile(context: JSSCompileContext, controller: ASTController) {
          if (!moved) {
            const source = controller.search({ key: moving }).find((node) => node.content === 2)
            const color = controller.search({ key: 'color' })[0]
            if (!source || !color) throw new Error('没有找到待移动的声明。')
            controller.move(source, { before: color })
            moved = true
          }
          return items.reduce<number>((sum, item) => sum + Number(item.content), 0)
        },
      }
    },
  })
  const css = compileRules([
    [[condition('.Moved')], moving, 1],
    [[condition('.Moved')], 'color', 'red'],
    [[condition('.Moved')], moving, 2],
  ])
  expect(css).toContain('--moving-aggregate: 3;\ncolor: red;')
})

test('默认 Key 将重复声明合为一条逗号数组', () => {
  const plain = key('margin-left')
  const css = compileRules([
    [[condition('.Plain')], plain, '7px'],
    [[condition('.Plain')], plain, '不是合法长度'],
  ])
  expect(css).toContain('margin-left: 7px, 不是合法长度;')
  expect(css.match(/margin-left:/g)).toHaveLength(1)
})

test('阴影关键词与其他内容按相同数组规则输出，CSS 有效性留给浏览器', () => {
  expect(compileRules([[[condition('.None')], $boxShadow, 'none']])).toContain('box-shadow: none;')
  expect(compileRules([
    [[condition('.Optional')], $boxShadow, undefined],
    [[condition('.Optional')], $boxShadow, 'none'],
  ])).toContain('box-shadow: none;')
  expect(compileRules([
    [[condition('.Empty')], $boxShadow, undefined],
    [[condition('.Empty')], $boxShadow, undefined],
  ])).not.toContain('box-shadow:')
  expect(compileRules([
    [[condition('.None')], $boxShadow, '1px 2px red'],
    [[condition('.None')], $boxShadow, 'none'],
  ])).toContain('box-shadow: 1px 2px red, none;')
  expect(compileRules([
    [[condition('.Inherit')], $boxShadow, 'inherit'],
    [[condition('.Inherit')], $boxShadow, '1px 2px red'],
  ])).toContain('box-shadow: inherit, 1px 2px red;')
})

test('登记句柄删除或替换贡献后，重新编译只看现存源规则', () => {
  const first = rule('.HandleShadow', $boxShadow, '1px 2px red')
  const second = rule('.HandleShadow', $boxShadow, '3px 4px blue')
  try {
    expect(compileCSS()).toContain('box-shadow: 1px 2px red, 3px 4px blue;')
    first.replace('5px 6px green')
    expect(compileCSS()).toContain('box-shadow: 5px 6px green, 3px 4px blue;')
    second.remove()
    expect(compileCSS()).toContain('box-shadow: 5px 6px green;')
    first.remove()
    expect(compileCSS()).not.toContain('.HandleShadow')
  } finally {
    first.remove()
    second.remove()
  }
})

test('公开 rules 声明序列重复普通 Key 自动聚合', () => {
  const handle = rules('.RulesShadow', [[$boxShadow, '1px 2px red'], [$boxShadow, '3px 4px blue']])
  try {
    expect(compileCSS()).toContain('box-shadow: 1px 2px red, 3px 4px blue;')
  } finally {
    handle.remove()
  }
})
