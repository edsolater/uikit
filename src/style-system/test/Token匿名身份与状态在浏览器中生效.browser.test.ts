/** 浏览器确认匿名 Token 的变量需求、状态、注册与局部修改。 */
import { stateCondition } from '../state-condition'
import { afterEach, expect, test } from 'vitest'
import { compileRules } from '../css-root'
import { token } from '../token'
import { modify } from '../operations/modify'
import { add, multiply } from '../pieces/functions/calc'
import { condition } from '../condition'
import { modification } from '../modification'
import { declare } from '../operations/declare'

afterEach(() => {
  document.body.replaceChildren()
  delete document.documentElement.dataset.large
  delete document.documentElement.dataset.latePhase
})

test.each(
  ['before', 'after'].flatMap((position) =>
    ['9px', undefined].map((value) => ({ position, value })),
  ),
)(
  '晚到根声明位置=$position、值=$value，默认保障不与显式基础竞争',
  ({ position, value }) => {
    const size = token('2px', {
      name: 'late-browser-size',
      address: ':where(:root)',
      state: [
        [stateCondition('&[data-late-phase]'), (base) => multiply(base, 2)],
      ],
    })
    const trigger = token(1, {
      compileWaveIndex: 2,
      onCompile(context, ast) {
        const nodes = ast.nodes()
        const anchor =
          position === 'before'
            ? { before: nodes[0] }
            : { after: nodes.at(-1)! }
        ast.insert(
          {
            ...anchor,
            conditionPath: {
              targetConditionPath: [condition(':where(:root)')],
              stateConditionPath: [],
            },
          },
          declare(size, value),
          { owner: context.node },
        )
      },
    })
    document.body.appendChild(document.createElement('style')).textContent =
      compileRules([
        [['.LateRoot'], 'width', size],
        [['.LateRoot'], 'min-width', 'var(--late-browser-size, 5px)'],
        [['.LateTrigger'], 'order', trigger],
      ])
    const target = document.body.appendChild(document.createElement('div'))
    target.className = 'LateRoot'
    if (value === undefined)
      expect(getComputedStyle(target).minWidth).toBe('5px')
    else expect(getComputedStyle(target).width).toBe('9px')
    document.documentElement.dataset.latePhase = ''
    if (value === undefined)
      expect(getComputedStyle(target).minWidth).toBe('5px')
    else expect(getComputedStyle(target).width).toBe('18px')
  },
)

test.each([false, true])(
  '多个晚到显式声明仍按实际书写顺序取最后值，反序=%s',
  (reverse) => {
    const size = token('2px', {
      name: 'late-explicit-order',
      address: ':where(:root)',
    })
    const trigger = token(1, {
      compileWaveIndex: 2,
      onCompile(context, ast) {
        const anchor = ast.nodes()[0]
        for (const value of reverse ? ['9px', '7px'] : ['7px', '9px']) {
          ast.insert(
            {
              before: anchor,
              conditionPath: {
                targetConditionPath: [condition(':where(:root)')],
                stateConditionPath: [],
              },
            },
            declare(size, value),
            { owner: context.node },
          )
        }
      },
    })
    document.body.appendChild(document.createElement('style')).textContent =
      compileRules([
        [['.ExplicitOrder'], 'width', size],
        [['.ExplicitTrigger'], 'order', trigger],
      ])
    const target = document.body.appendChild(document.createElement('div'))
    target.className = 'ExplicitOrder'
    expect(getComputedStyle(target).width).toBe(reverse ? '7px' : '9px')
  },
)

test.each([
  'size-modify-1-base',
  'size-modify-1-step-1',
  'size-modify-1-step-1-identity',
  'size-modify-1-step-1-candidate-1',
  'size-modify-1-step-1-present',
])('合法公开名称 %s 不与修改产物串值，重复编译输出稳定', (name) => {
  const size = token('2px', {
    name: 'size',
    registration: { syntax: '<length>', inherits: false, initialValue: '2px' },
  })
  const sentinel = token('99px', name)
  const rules: import('../rule').Rules = [
    [['.Collision'], 'height', sentinel],
    [['.Collision'], 'width', size],
    [
      ['.Collision'],
      ...modify(size, {
        type: 'expression',
        detail: (current) => add(current, '1px'),
      }),
    ],
  ]
  const css = compileRules(rules)
  compileRules([
    [['.Unrelated'], 'width', token('1px', { state: { hover: '2px' } })],
  ])
  expect(compileRules(rules)).toBe(css)
  document.body.appendChild(document.createElement('style')).textContent = css
  const target = document.body.appendChild(document.createElement('div'))
  target.className = 'Collision'
  expect(getComputedStyle(target).width).toBe('3px')
  expect(getComputedStyle(target).height).toBe('99px')
})

test('后创建的显式名称占用前次修改基础名时，重新编译仍保留双方值', () => {
  const size = token('2px', 'cached-modification-size')
  const rules: import('../rule').Rules = [
    [['.CachedModification'], 'width', size],
    [
      ['.CachedModification'],
      ...modify(size, {
        type: 'expression',
        detail: (current) => add(current, '1px'),
      }),
    ],
  ]
  const firstCSS = compileRules(rules)
  const baseDeclaration = firstCSS.match(/(--[^:\s]+):\s*2px;/)
  expect(baseDeclaration).not.toBeNull()
  const sentinel = token('99px', baseDeclaration![1])
  const updated: import('../rule').Rules = [
    ...rules,
    [['.CachedModification'], 'height', sentinel],
  ]
  const css = compileRules(updated)
  expect(compileRules(updated)).toBe(css)
  document.body.appendChild(document.createElement('style')).textContent = css
  const target = document.body.appendChild(document.createElement('div'))
  target.className = 'CachedModification'
  expect(getComputedStyle(target).width).toBe('3px')
  expect(getComputedStyle(target).height).toBe('99px')
})

test('后创建的显式名称占用匿名 Token 的前次名称时，重新编译仍保留双方值', () => {
  const size = token('2px', {
    state: [[stateCondition('&[data-large]'), '4px']],
  })
  const rules: import('../rule').Rules = [[['.CachedAnonymous'], 'width', size]]
  const firstCSS = compileRules(rules)
  const widthReference = firstCSS.match(/\bwidth:\s*var\((--[^,\s)]+)\)/)
  expect(widthReference).not.toBeNull()
  const sentinel = token('99px', widthReference![1])
  const updated: import('../rule').Rules = [
    ...rules,
    [['.CachedAnonymous'], 'height', sentinel],
  ]
  const css = compileRules(updated)
  expect(compileRules(updated)).toBe(css)
  document.body.appendChild(document.createElement('style')).textContent = css
  const target = document.body.appendChild(document.createElement('div'))
  target.className = 'CachedAnonymous'
  expect(getComputedStyle(target).width).toBe('2px')
  expect(getComputedStyle(target).height).toBe('99px')
  target.dataset.large = ''
  expect(getComputedStyle(target).width).toBe('4px')
  expect(getComputedStyle(target).height).toBe('99px')
})

test('同次编译中延迟创建的显式名称占用修改基础名时，修改结果仍正确', () => {
  const size = token('2px', 'producer-collision-size')
  const rules: import('../rule').Rules = [
    [['.ProducerCollision'], 'width', size],
    [
      ['.ProducerCollision'],
      ...modify(size, {
        type: 'expression',
        detail: (current) => add(current, '1px'),
      }),
    ],
  ]
  const firstCSS = compileRules(rules)
  const baseDeclaration = firstCSS.match(/(--[^:\s]+):\s*2px;/)
  expect(baseDeclaration).not.toBeNull()
  const updated: import('../rule').Rules = [
    ...rules,
    [
      ['.ProducerCollision'],
      'height',
      () => token('99px', baseDeclaration![1]),
    ],
  ]
  const css = compileRules(updated)
  document.body.appendChild(document.createElement('style')).textContent = css
  const target = document.body.appendChild(document.createElement('div'))
  target.className = 'ProducerCollision'
  expect(getComputedStyle(target).width).toBe('3px')
  expect(getComputedStyle(target).height).toBe('99px')
  expect(compileRules(updated)).toBe(css)
})

test('扫描资源排队后自动名称被显式占用，两个声明仍各自生效', () => {
  const size = token('2px', { address: '.Probe' })
  const firstCSS = compileRules([[['.Probe'], 'width', size]])
  const baseDeclaration = firstCSS.match(/(--[^:\s]+):\s*2px;/)
  expect(baseDeclaration).not.toBeNull()
  const first = token(1, {
    onFirstScan: () => [[['.Probe'], ...declare(size, '4px')]],
  })
  const second = token(1, {
    onFirstScan: () => {
      const explicit = token('99px', baseDeclaration![1])
      return [
        [['.Probe'], ...declare(explicit, '99px')],
        [['.Probe'], 'height', explicit],
      ]
    },
  })
  document.body.appendChild(document.createElement('style')).textContent =
    compileRules([
      [['.Probe'], 'order', first],
      [['.Probe'], 'z-index', second],
      [['.Probe'], 'width', size],
    ])
  const target = document.body.appendChild(document.createElement('div'))
  target.className = 'Probe'
  expect(getComputedStyle(target).width).toBe('4px')
  expect(getComputedStyle(target).height).toBe('99px')
})

test('直接表达式与 default 简写都在当地读取覆盖后的 9px，得到 10px', () => {
  const source = token('2px', 'equivalent-local-source')
  const expression = add(source, '1px')
  const direct = token(expression),
    definition = token(expression)
  document.body.appendChild(document.createElement('style')).textContent =
    compileRules([
      [['.Local, .Neighbor'], 'width', direct],
      [['.Local, .Neighbor'], 'height', definition],
      [['.Local'], ...declare(source, '9px')],
    ])
  const local = document.body.appendChild(document.createElement('div'))
  local.className = 'Local'
  const neighbor = document.body.appendChild(document.createElement('div'))
  neighbor.className = 'Neighbor'
  expect(getComputedStyle(local).width).toBe('10px')
  expect(getComputedStyle(local).height).toBe('10px')
  expect(getComputedStyle(neighbor).width).toBe('3px')
  expect(getComputedStyle(neighbor).height).toBe('3px')
})

test.each(['name', 'state', 'address', 'registration', 'modify'] as const)(
  '%s 需求使匿名或具名 Token 正确声明并消费',
  (kind) => {
    const size = token(
      '4px',
      kind === 'name'
        ? { name: 'explicit-size' }
        : kind === 'state'
          ? { state: [[stateCondition('&[data-large]'), '8px']] }
          : kind === 'address'
            ? { address: '.Target' }
            : kind === 'registration'
              ? {
                  registration: {
                    syntax: '<length>',
                    inherits: true,
                    initialValue: '1px',
                  },
                }
              : {},
    )
    const rules: import('../rule').Rules = [[['.Target'], 'width', size]]
    if (kind === 'modify')
      rules.push([
        ['.Target'],
        ...modify(size, {
          type: 'expression',
          detail: (current) => add(current, '3px'),
        }),
      ])
    const style = document.body.appendChild(document.createElement('style'))
    style.textContent = compileRules(rules)
    const target = document.body.appendChild(document.createElement('div'))
    target.className = 'Target'
    expect(getComputedStyle(target).width).toBe(
      kind === 'modify' ? '7px' : '4px',
    )
    expect(size._kind).toBe('css-variable')
    if (kind === 'state') {
      target.dataset.large = ''
      expect(getComputedStyle(target).width).toBe('8px')
      delete target.dataset.large
      expect(getComputedStyle(target).width).toBe('4px')
    }
  },
)

test('晚到编译回调插入的条件修改得到 7px，条件外仍为 4px', () => {
  const size = token('4px')
  const trigger = token(1, {
    compileWaveIndex: 3,
    onCompile(context, ast) {
      ast.insert(
        {
          after: context.node,
          conditionPath: {
            targetConditionPath: [condition('.Late[data-change]')],
            stateConditionPath: [],
          },
        },
        modify(size, {
          type: 'expression',
          detail: (current) => add(current, '3px'),
        }),
        { owner: context.node },
      )
    },
  })
  document.body.appendChild(document.createElement('style')).textContent =
    compileRules([
      [['.Late'], 'width', size],
      [['.Trigger'], 'opacity', trigger],
    ])
  const changed = document.body.appendChild(document.createElement('div'))
  changed.className = 'Late'
  changed.dataset.change = ''
  const neighbor = document.body.appendChild(document.createElement('div'))
  neighbor.className = 'Late'
  expect(getComputedStyle(changed).width).toBe('7px')
  expect(getComputedStyle(neighbor).width).toBe('4px')
  delete changed.dataset.change
  expect(getComputedStyle(changed).width).toBe('4px')
})

test('匿名目标与匿名配方各自取得名称，两个来源不会因分配冲突而串值', () => {
  const first = token('oklch(0.4 0.1 120)'),
    second = token('oklch(0.6 0.1 240)')
  const recipe = modification({ type: 'color', detail: { alpha: 0.5 } })
  document.body.appendChild(document.createElement('style')).textContent =
    compileRules([
      [['.First'], 'color', first],
      [['.First'], ...modify(first, recipe)],
      [['.Second'], 'color', second],
      [['.Second'], ...modify(second, recipe)],
    ])
  const a = document.body.appendChild(document.createElement('div'))
  a.className = 'First'
  const b = document.body.appendChild(document.createElement('div'))
  b.className = 'Second'
  expect(getComputedStyle(a).color).toBe('oklch(0.4 0.1 120 / 0.5)')
  expect(getComputedStyle(b).color).toBe('oklch(0.6 0.1 240 / 0.5)')
})
