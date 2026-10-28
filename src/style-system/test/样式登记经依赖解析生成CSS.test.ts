/**
 * 样式登记与内容依赖解析的流程测试。
 *
 * 验证声明、Mixin、Token 和按需资源生成完整 CSS。
 *
 * 防止定义端组合在编译与资源退出时丢失原有语义。
 */
import { token } from '../token'
import { afterEach, expect, test, vi } from 'vitest'
import { compileCSS, compileRules } from '../css-root'
import {
  rule,
  rules,
  type Rules,
  type RulesHandle,
  type Declarations,
  type DeclarationItem,
} from '../rule'
import {
  condition,
  resolveConditionPath,
  type ConditionInput,
} from '../condition'
import { key, registerGlobalJSSKeyInStorage } from '../key'
import { declare } from '../operations/declare'
import { createJSSContent } from '../content'
import { valueSequence } from '../pieces/token-factory/list'
import { $margin, $marginLeft } from '../key-registry'
import { $padding } from '../key-registry'
import { $border } from '../key-registry'
import { $font } from '../key-registry'
import { $color } from '../key-registry'

import { $boxShadow } from '../key-registry'
import { shadowValue } from '../pieces/token-factory/shadow'
import { multiply } from '../pieces/functions/calc'

import { cssFunction } from '../css-function'
import {
  animationName,
  animationValue,
} from '../pieces/token-factory/animation'
import { fontValue } from '../pieces/token-factory/font'

import { contentLayout, contentText } from '../pieces/mixins/content'
import { boundary } from '../pieces/mixins/structure'

import { motionDuration } from '../pieces/tokens/motion'
import { lineColor } from '../pieces/tokens/color/colors'

test('动效按需提供根规则，分隔线在消费者处引用文字变量，空输入不激活', () => {
  expect(compileRules([])).toBe('')
  const motionCSS = compileRules([
    [[condition('.Motion')], 'transition-duration', motionDuration],
  ])
  expect(motionCSS).toContain('--motion-duration: 180ms;')
  expect(motionCSS).toContain('@media (prefers-reduced-motion: reduce)')
  expect(motionCSS).toContain('--motion-duration: calc(180ms * 0);')
  expect(motionCSS).not.toContain('--line-color:')
  const lineCSS = compileRules([
    [
      [condition('.Line')],
      'border-color',
      lineColor(token('black', 'local-line-base')),
    ],
  ])
  expect(lineCSS).toContain('border-color: var(--local-line-base-line);')
  expect(lineCSS).toContain('var(--local-line-base)')
  expect(lineCSS).toContain(':root')
  expect(lineCSS).not.toContain('--motion-duration:')
})

test('线条共享来源资源，最后消费者退出后释放', () => {
  const active = vi.fn((): Rules => [[['.LineResource'], 'display', 'block']])
  const base = token('red', {
    name: 'registered-line-source',
    address: '.RegisteredLine',
    onFirstScan: active,
  })
  const line = lineColor(base)
  expect(active).not.toHaveBeenCalled()
  const sourceHandle = rule('.RegisteredLine', 'background-color', base)
  const lineHandle = rule('.RegisteredLine', 'color', line)
  try {
    const css = compileCSS()
    expect(css).toContain('.LineResource')
    expect(active).toHaveBeenCalledTimes(1)
    sourceHandle.remove()
    expect(compileCSS()).toContain('.LineResource')
    lineHandle.remove()
    const released = compileCSS()
    expect(released).not.toContain('.LineResource')
  } finally {
    sourceHandle.remove()
    lineHandle.remove()
  }
})

test('Token 创建时不激活，按需规则可引用自身与稍后创建的 Token', () => {
  const baseline = compileCSS()
  const firstActive = vi.fn((): Rules => [
    [[condition(':where(:root)')], first, 'red'],
    [[condition('.Linked')], 'color', second],
  ])
  const first = token('black', {
    name: 'linked-first-color',
    onFirstScan: firstActive,
  })
  const secondActive = vi.fn((): Rules => [
    [[condition(':where(:root)')], second, 'blue'],
  ])
  const second = token('navy', {
    name: 'linked-second-color',
    onFirstScan: secondActive,
  })
  expect(firstActive).not.toHaveBeenCalled()
  expect(secondActive).not.toHaveBeenCalled()
  expect(compileCSS()).toBe(baseline)

  const handle = keep(rule('.Linked', 'border-color', first))
  const css = compileCSS()
  expect(firstActive).toHaveBeenCalledTimes(1)
  expect(secondActive).toHaveBeenCalledTimes(1)
  expect(css).toContain('--linked-first-color: red;')
  expect(css).toContain('--linked-second-color: blue;')
  handle.remove()
  expect(compileCSS()).toBe(baseline)
})
const runtimeRules = rules as (
  path: ConditionInput,
  declarations: unknown,
) => RulesHandle

const handles: RulesHandle[] = []
/**
 * 保留正式登记返回的句柄，交给 afterEach 清理；不改变句柄能力。
 */
function keep<T extends RulesHandle>(handle: T): T {
  handles.push(handle)
  return handle
}
afterEach(() => {
  for (const handle of handles.splice(0)) handle.remove()
  vi.restoreAllMocks()
})

test('Token 生产函数可返回直接内容或另一 Token，自身循环明确失败', () => {
  const baseSize = token('8px', { name: 'base-size' })
  const directSize = token(() => '12px', { name: 'direct-size' })
  const linkedSize = token(() => baseSize, { name: 'linked-size' })
  keep(rule('.LazyVariableSource', 'width', directSize))
  keep(rule('.LazyVariableSource', 'height', linkedSize))
  const css = compileCSS()
  expect(css).toContain('width: var(--direct-size);')
  expect(css).toContain('height: var(--linked-size);')

  let circular: ReturnType<typeof token>
  circular = token(() => circular, 'direct-circular-source')
  keep(rule('.CircularSource', 'color', circular))
  expect(() => compileCSS()).toThrow('循环引用')
})

test('三项 Rule 递归继承地址，普通 Rule 的重复条件原样保留', () => {
  const child: Rules = [[[condition('&:hover')], undefined, 'blue']]
  const source: Rules = [
    [[condition('.example'), condition('&:hover')], 'color', child],
  ]
  keep(rule(undefined, undefined, source))
  expect(compileCSS()).toMatch(/&:hover\s*\{\s*&:hover\s*\{\s*color:\s*blue;/)
})

test('同址声明在末项合并，删除句柄不影响其他登记', () => {
  const first = keep(rule('.example', 'color', 'red'))
  keep(rule('.example', 'display', 'grid'))
  const second = keep(rule('.example', key('color'), 'blue'))
  expect(
    [...compileCSS().matchAll(/(?:color|display):\s*([^;]+);/g)].map(
      ([, text]) => text,
    ),
  ).toEqual(['grid', 'red, blue'])
  first.remove()
  expect(() => first.replace('black')).toThrow('已删除')
  second.replace('green')
  expect(compileCSS()).toContain('color: green')
  second.remove()
  expect(compileCSS()).not.toContain('color:')
  expect(() => second.replace('purple')).toThrow()
})

test('同一内容重复登记，旧句柄不能删除新登记', () => {
  const content = token('red')
  const handle = keep(rule('.example', 'color', content))
  keep(rule('.example', 'color', content))
  handle.remove()
  expect(compileCSS()).toContain('color: red')
})

test('Condition header 决定真实地址，不同 CSS 条件分别保留', () => {
  keep(rule(['.example', condition('&:hover')], 'color', 'red'))
  keep(rule(['.example', condition('&:where(:hover)')], 'color', 'blue'))
  const css = compileCSS()
  expect(css).toContain('&:hover {\ncolor: red;')
  expect(css).toContain('&:where(:hover) {\ncolor: blue;')
})

test('二元条目隐式声明 Token，并保留内容引用的同一目标身份', () => {
  const content = token('black', { name: 'local-content' })
  keep(
    rules('.example', [
      [content, 'red'],
      [$color, content],
    ]),
  )
  const css = compileCSS()
  expect(css).toContain('--local-content: red;')
  expect(css).toContain('color: var(--local-content);')
})

test.each(['css-declaration', 'css-modification'])(
  '普通表达式的同名 kind=%s 字段不改变 Token 基础内容',
  (kind) => {
    const name = `entry-expression-${kind}`
    const size = token('2px', { name, address: '.EntryExpression' })
    const expression = Object.assign(
      createJSSContent(() => '11px'),
      { kind },
    )
    keep(
      rules('.EntryExpression', [
        [size, expression],
        ['width', size],
      ]),
    )
    const css = compileCSS()
    expect(css).toContain(`--${name}: 11px;`)
    expect(css).toContain(`width: var(--${name});`)
  },
)

test('声明名称指向明确属性，不猜测未知名称', () => {
  keep(rule('.Names', 'alignItems', 'center'))
  keep(rule('.Names', 'future-property', 'native-value'))
  keep(rule('.Names', '--local-property', 'custom-value'))
  keep(rule('.SingleName', 'justifyContent', 'center'))
  const css = compileCSS()
  expect(css).toContain('align-items: center;')
  expect(css).toContain('future-property: native-value;')
  expect(css).toContain('--local-property: custom-value;')
  expect(css).toContain('justify-content: center;')
  registerGlobalJSSKeyInStorage(key('test-collision-target'))
  expect(() =>
    registerGlobalJSSKeyInStorage(key('testCollision-target')),
  ).toThrow('JSSKey 名称冲突：testCollisionTarget')
  expect(() => rule('.PartialName', 'testCollision-target', 'value')).toThrow(
    '未知 JSSKey 名称：testCollision-target',
  )
  expect(() => rule('.Unknown', 'unknownAlias', 'value')).toThrow(
    '未知 JSSKey 名称：unknownAlias',
  )
})

test.each(
  (
    [
      { name: 'CSS 对象键', entry: { 'margin-left': '2px' } },
      { name: 'Key 变量条目', entry: [$marginLeft, '2px'] },
    ] satisfies { name: string; entry: DeclarationItem }[]
  ).flatMap(({ name, entry: item }) => {
    const forms: [string, DeclarationItem][] = [
      ['直接传入', item],
      ['数组内嵌套', [item]],
      ['多层数组嵌套', [[[item]]]],
      ['与其他声明混合', [{ color: 'red' }, [item, ['width', '3px']]]],
      ['Set 与数组嵌套', new Set<DeclarationItem>([[item]])],
    ]
    return forms.map(([form, input]) => ({ name, form, input }))
  }),
)('$name 的$form 输出同一 CSS 属性', ({ input }) => {
  const baseline = compileCSS()
  const handle = keep(rules('.Ordered', input))
  const css = compileCSS()
  expect(css).toContain('.Ordered')
  expect(css.match(/margin-left: 2px;/g)).toHaveLength(1)
  expect(css).not.toContain('marginLeft:')
  handle.remove()
  expect(compileCSS()).toBe(baseline)
})

test('对象与字符串条目混入嵌套 Iterable 后保留声明顺序和内容', () => {
  const local = token('black', { name: 'ordered-local' })
  const content = vi.fn(() => '4px')
  const nested: Declarations = [
    ['margin', '1px'],
    [{ marginLeft: '2px' }, ['margin', '3px']],
    undefined,
    new Set<DeclarationItem>([
      [local, 'red'],
      { padding: createJSSContent(content) },
      ['color', local],
    ]),
  ]
  keep(rules('.Ordered', nested))
  keep(rules('.ObjectInput', { paddingBlock: '2px' }))
  keep(rules('.SingleEntry', ['outline-offset', '3px']))
  expect(content).not.toHaveBeenCalled()
  const css = compileCSS()
  expect(
    [...css.matchAll(/(margin(?:-left)?):\s*([^;]+);/g)].map(
      ([, key, text]) => [key, text],
    ),
  ).toEqual([
    ['margin-left', '2px'],
    ['margin', '1px, 3px'],
  ])
  expect(css).toContain('--ordered-local: red;')
  expect(css).toContain('padding: 4px;')
  expect(css).toContain('color: var(--ordered-local);')
  expect(css).toContain('padding-block: 2px;')
  expect(css).toContain('outline-offset: 3px;')
  expect(content).toHaveBeenCalled()
})

test('二元组保留 Key 的组合协议和 Token 的资源身份，不使用 JS 字符串化', () => {
  const baseline = compileCSS()
  const total = Object.assign(
    key('entry-total', {
      join: (values) =>
        values.reduce((sum, value) => sum + Number(value.content), 0),
    }),
    {
      toString() {
        throw new Error('声明目标不能经过 JS 字符串化。')
      },
    },
  )
  registerGlobalJSSKeyInStorage(total)
  const size = Object.assign(
    token('4px', {
      name: 'entry-resource-size',
      registration: { syntax: '<length>', inherits: true, initialValue: '1px' },
      onFirstScan: () => [[['.EntryResource'], 'height', '2px']] as Rules,
    }),
    { toString: () => '业务标识而非属性名称' },
  )
  const batch = keep(
    rules(':root', [
      [total, 2],
      { 'entry-total': 3 },
      [size, '6px'],
      ['width', size],
    ]),
  )
  const css = compileCSS()
  expect(css).toContain('entry-total: 5;')
  expect(css).toContain('--entry-resource-size: 6px;')
  expect(css).toContain('width: var(--entry-resource-size);')
  expect(css).toContain('@property --entry-resource-size')
  expect(css).toContain('.EntryResource')
  batch.remove()
  expect(compileCSS()).toBe(baseline)
})

test('任意层路径组合与声明组合生成相同嵌套 CSS，Condition 保留身份', () => {
  const root = condition('.NestedInput')
  const path = [
    root,
    [['&:hover'], [[[], '.label']]],
  ] as const satisfies ConditionInput
  const resolved = resolveConditionPath(path)!
  expect(resolved[0]).toBe(root)
  expect(resolved.map((item) => item.header)).toEqual([
    '.NestedInput',
    '&:hover',
    '.label',
  ])
  expect(resolveConditionPath(undefined)).toBeUndefined()
  expect(resolveConditionPath([[[]]])).toEqual([])

  const deep = rules(path, [
    [[[{ color: 'red' }]], [[['padding', '3px']]], [[key('display'), 'grid']]],
  ])
  const deepCSS = compileCSS()
  expect(deepCSS).toContain('.NestedInput')
  expect(deepCSS).toContain('&:hover')
  expect(deepCSS).toContain('.label')
  expect(deepCSS).toContain('color: red;')
  expect(deepCSS).toContain('padding: 3px;')
  expect(deepCSS).toContain('display: grid;')
  deep.remove()
  keep(
    rules([root, '&:hover', '.label'], {
      color: 'red',
      padding: '3px',
      display: 'grid',
    }),
  )
  expect(compileCSS()).toBe(deepCSS)
})

test('深路径中的缺失成员仍整批拒绝，不吞掉稀疏孔', () => {
  const before = compileCSS()
  for (const invalid of [undefined, null, 1, { header: 1 }]) {
    expect(() =>
      runtimeRules(
        ['.InvalidNested', [[invalid]]] as unknown as ConditionInput,
        { color: 'red' },
      ),
    ).toThrow('Condition Path')
  }
  expect(() =>
    runtimeRules(['.InvalidNested', [new Array(1)]], { color: 'red' }),
  ).toThrow('Condition Path')
  expect(compileCSS()).toBe(before)
})

test('嵌套批量声明与单项属性不会混淆', () => {
  keep(
    rules('.example', [
      [
        [$color, 'red'],
        [$padding, '1px'],
      ],
    ]),
  )
  expect(compileCSS()).toContain('padding: 1px')
  expect(compileCSS()).toContain('color: red')
})

test('声明组合忽略空项和 content 为 undefined 的 Declaration，不把缺失声明登记为 Rule', () => {
  keep(
    rules('.example', [
      undefined,
      [$color, 'red'],
      [$font, undefined],
      [undefined, [$padding, '1px'], undefined],
    ]),
  )
  keep(rules('.omitted', [declare($color, undefined)]))
  const css = compileCSS()
  expect(css).toContain('color: red;')
  expect(css).toContain('padding: 1px;')
  expect(css).not.toContain('.omitted')
  expect(css).not.toContain('font:')
})

test('批量登记先验证整批，失败时既有条目与句柄保持有效', () => {
  const original = keep(rule('.example', 'color', 'red'))
  const before = compileCSS()
  const invalid = [
    [$color, 'blue'],
    [{ name: 1 }, 'grid'],
  ] as unknown as Declarations
  expect(() => keep(runtimeRules('.example', invalid))).toThrow(
    '只接受声明序列',
  )
  expect(compileCSS()).toBe(before)
  original.replace('green')
  expect(compileCSS()).toContain('color: green')
  const recursive: unknown[] = [[$color, 'blue']]
  recursive.push(recursive)
  expect(() =>
    keep(runtimeRules('.example', recursive as Declarations)),
  ).toThrow('递归引用')
  expect(compileCSS()).toContain('color: green')
  const invalidProperty = [
    [$color, 'blue'],
    [{ name: 1 }, 'grid'],
  ] as unknown as Declarations
  expect(() => keep(runtimeRules('.example', invalidProperty))).toThrow()
  keep(rules('.example', [[$color, undefined]]))
  expect(() =>
    keep(runtimeRules([null] as unknown as ConditionInput, [[$color, 'blue']])),
  ).toThrow('Condition Path')
  expect(() =>
    keep(runtimeRules(new Array(1) as ConditionInput, [[$color, 'blue']])),
  ).toThrow('Condition Path')
  expect(compileCSS()).toContain('color: green')
})

test('迭代器抛错与字符串输入整批失败，不留下已经读取的声明', () => {
  const original = keep(rule('.Atomic', 'color', 'red'))
  const before = compileCSS()
  function* broken(): IterableIterator<[string, string]> {
    yield ['color', 'blue']
    throw new Error('读取声明失败。')
  }
  expect(() => runtimeRules('.Atomic', broken())).toThrow('读取声明失败')
  expect(() =>
    runtimeRules('.Atomic', 'color' as unknown as Declarations),
  ).toThrow('只接受声明序列')
  expect(compileCSS()).toBe(before)
  original.replace('green')
  expect(compileCSS()).toContain('color: green;')
  expect(compileCSS()).not.toContain('color: blue;')
})

test('批量删除仅删除本批声明，重复声明在末项合并', () => {
  const batch = keep(
    rules('.example', [
      [$color, 'red'],
      [key('display'), 'grid'],
      [[$color, 'blue']],
    ]),
  )
  expect(
    [...compileCSS().matchAll(/(?:color|display):\s*([^;]+);/g)].map(
      ([, text]) => text,
    ),
  ).toEqual(['grid', 'red, blue'])
  keep(rule('.example', 'color', 'green'))
  batch.remove()
  batch.remove()
  expect(compileCSS()).toContain('color: green;')
  expect(compileCSS()).not.toContain('color: red;')
  expect(compileCSS()).not.toContain('color: blue;')
})

test('普通 Rules 通过结构嵌套切换属性，不进入 Token', () => {
  const base: Rules = [
    [undefined, 'color', 'red'],
    [undefined, 'display', 'grid'],
  ]
  const matched: Rules = [[undefined, 'color', 'blue']]
  keep(rule('.example', undefined, base))
  keep(rule(['.example', '&:hover'], undefined, matched))
  const css = compileCSS()
  expect(css).toContain('color: red;')
  expect(css).toContain('display: grid;')
  expect(css).toMatch(/&:hover\s*\{\s*color:\s*blue;/)
})

test('依赖只进入本次编译，删掉源条目后派生资源退出', () => {
  const nestedActive = vi.fn((): Rules => [
    [[condition(':root')], '--value-factor', 3],
  ])
  const nested = token('3px', { onFirstScan: nestedActive })
  const active = vi.fn((): Rules => [
    [[condition(':root')], '--size-example', nested],
  ])
  const size = token('var(--size-example)', { onFirstScan: active })
  const handle = keep(rule('.example', 'width', multiply(size, size)))
  expect(active).not.toHaveBeenCalled()
  expect(compileCSS()).toContain('--value-factor: 3')
  expect(active).toHaveBeenCalledTimes(1)
  expect(nestedActive).toHaveBeenCalledTimes(1)
  compileCSS()
  expect(active).toHaveBeenCalledTimes(2)
  handle.remove()
  expect(compileCSS()).toBe('')
})

test('根值、注册、函数与关键帧只随消费进入 CSS，撤销后全部退出', () => {
  const baseline = compileCSS()
  const color = token('red', {
    name: 'resource-color',
    registration: { syntax: '<color>', inherits: true, initialValue: 'black' },
    onFirstScan: (): Rules => [[[condition(':where(:root)')], color, 'blue']],
  })
  const frames: Rules = [
    [[condition('from')], 'opacity', 0],
    [[condition('to')], 'opacity', 1],
  ]
  const motion = animationValue({
    name: animationName('resource-motion', frames),
    duration: '1s',
  })
  const length = cssFunction('--resource-length() returns <length>', [
    [undefined, 'result', '2px'],
  ])()
  expect(compileCSS()).toBe(baseline)

  const colorHandle = keep(rule('.Resources', 'color', color))
  const motionHandle = keep(rule('.Resources', 'animation', motion))
  const lengthHandle = keep(rule('.Resources', 'width', length))
  const css = compileCSS()
  expect(css).toContain('--resource-color: blue;')
  expect(css).toContain('@property --resource-color')
  expect(css).toContain('@keyframes resource-motion')
  expect(css).toContain('@function --resource-length() returns <length>')

  colorHandle.remove()
  motionHandle.remove()
  lengthHandle.remove()
  expect(compileCSS()).toBe(baseline)
})

test('依赖回指同一集合终止，Rules 内容递归报错', () => {
  const dependency: Rules = []
  dependency.push([
    [condition('.example')],
    'color',
    token('red', { onFirstScan: () => dependency }),
  ])
  const handle = keep(rule(undefined, undefined, dependency))
  expect(compileCSS()).toContain('color: red')
  handle.remove()
  const recursive: Rules = []
  recursive.push([undefined, undefined, recursive])
  keep(rule(undefined, undefined, recursive))
  expect(() => compileCSS()).toThrow('递归引用')
})

test('原生简写原样保留，复合字段由内容函数编译', () => {
  keep(
    rules('.example', [
      [$margin, '4px'],
      [$marginLeft, '8px'],
      [$padding, valueSequence('1px', '2px', '3px')],
      [$border, valueSequence('red', '4px', 'solid')],
      [
        $font,
        fontValue({
          style: 'italic',
          size: '16px',
          lineHeight: 1.5,
          family: 'system-ui',
        }),
      ],
    ]),
  )
  keep(
    rules('.single', [
      [$padding, '4px'],
      [$border, 'none'],
    ]),
  )
  const css = compileCSS()
  expect(css).toContain('margin-left: 8px')
  expect(css).toContain('margin: 4px')
  expect(css).toContain('padding: 1px 2px 3px')
  expect(css).toContain('font: italic 16px/1.5 system-ui')
  expect(css).toContain('.single {\npadding: 4px')
  expect(css).toContain('border: none')
})

test('简写与详细属性保持相对顺序，同名声明在末项合并', () => {
  handles.push(
    rules('.Native', [
      [key('padding'), '2px 4px'],
      [key('padding-left'), '8px'],
      [key('padding'), '10px'],
      [key('future-property'), 'native-value'],
    ]),
  )
  expect(
    [...compileCSS().matchAll(/(padding(?:-left)?):\s*([^;]+);/g)].map(
      ([, name, text]) => [name, text],
    ),
  ).toEqual([
    ['padding-left', '8px'],
    ['padding', '2px 4px, 10px'],
  ])
  expect(compileCSS()).toContain('future-property: native-value;')
})

test('Mixin 处理方向配置，Key 不解释对象', () => {
  handles.push(rules('.Layout', [contentLayout({ padding: { left: '4px' } })]))
  expect(compileCSS()).toContain('padding-left: 4px;')
  expect(compileCSS()).not.toContain('display:')
})

test('内容 Mixin 先识别完整内容，再识别方向和字体配置', () => {
  const activate = vi.fn((): Rules => [
    [[condition(':root')], '--padding-resource', '4px'],
  ])
  const compileFont = vi.fn(
    (
      context: import('../content').JSSCompileContext,
      controller: import('../compiler/contracts').ASTController,
    ) => {
      controller.setContent(context, 'italic 18px system-ui')
    },
  )
  keep(
    rules('.ResourcePadding', [
      contentLayout({ padding: { onFirstScan: activate } }),
    ]),
  )
  keep(
    rules('.ContentFont', [
      contentText({ font: { family: 'metadata', onCompile: compileFont } }),
    ]),
  )
  keep(
    rules('.PlainConfig', [
      contentLayout({ padding: { top: '2px', left: '4px' } }),
      contentText({ font: { size: '16px', family: 'serif' } }),
    ]),
  )
  const css = compileCSS()
  expect(activate).toHaveBeenCalledTimes(1)
  expect(css).toContain('--padding-resource: 4px;')
  expect(css).not.toContain('.ResourcePadding')
  expect(compileFont).toHaveBeenCalledTimes(1)
  expect(css).toContain('.ContentFont {\nfont: italic 18px system-ui;')
  expect(css).toContain('padding-top: 2px;')
  expect(css).toContain('padding-left: 4px;')
  expect(css).toContain('font: 16px serif;')
})

test('编译 root 的规则容器改写不污染登记账本或直接输入', () => {
  const target = keep(rule('.SnapshotTarget', 'color', 'red'))
  const trigger = keep(
    rule('.SnapshotTrigger', undefined, {
      onFirstScan: ({ root }) => {
        root.find((entry) =>
          entry[0]?.some(
            (item) =>
              typeof item !== 'string' && item.header === '.SnapshotTarget',
          ),
        )![2] = 'blue'
      },
    }),
  )
  expect(compileCSS()).toContain('color: red;')
  trigger.remove()
  expect(compileCSS()).toContain('color: red;')
  target.remove()

  const shared = token('green', { name: 'snapshot-shared-color' })
  const childPath = [condition('& .Child')]
  const nested: Rules = [[childPath, 'color', shared]]
  const sourcePath = [condition('.SnapshotInput')]
  const source: Rules = [[sourcePath, undefined, nested]]
  source.push([
    [condition('.MutateSnapshot')],
    undefined,
    {
      onFirstScan: ({ root }) => {
        expect(root[0][2]).not.toBe(nested)
        const snapshot = root[0][2] as Rules
        expect(snapshot[0][2]).toBe(shared)
        root[0][0]!.push(condition('.Extra'))
        snapshot[0][0]!.push(condition('.NestedExtra'))
        snapshot[0][2] = 'blue'
      },
    },
  ])
  const css = compileRules(source)
  expect(css).toContain('var(--snapshot-shared-color)')
  expect(sourcePath).toHaveLength(1)
  expect(childPath).toHaveLength(1)
  expect(nested[0][2]).toBe(shared)
  source.pop()
  expect(compileRules(source)).toContain('var(--snapshot-shared-color)')
  const circular: Rules = []
  circular.push([undefined, undefined, circular])
  expect(() => compileRules(circular)).toThrow('递归引用')
  for (const invalid of [[1], [[]]]) {
    expect(() =>
      compileRules([[undefined, undefined, invalid as unknown as Rules]]),
    ).toThrow('嵌套 Rules 必须由路径、Key、内容三项组成')
  }
})

test('边界形状按需输出，省略时保留边框和焦点配置', () => {
  keep(
    rules('.Shape', [boundary({ radius: '999px', cornerShape: 'squircle' })]),
  )
  keep(
    rules('.Boundary', [
      boundary({
        border: ['1px', 'solid', 'transparent'],
        outline: { width: '2px', style: 'solid', color: 'blue', offset: '2px' },
      }),
    ]),
  )
  keep(rules('.EmptyBoundary', [boundary()]))
  const css = compileCSS()
  expect(css).toContain(
    '.Shape {\nborder-radius: 999px;\ncorner-shape: squircle;',
  )
  expect(css).toContain(
    '.Boundary {\nborder: 1px solid transparent;\noutline-width: 2px;\noutline-style: solid;\noutline-color: blue;\noutline-offset: 2px;',
  )
  expect(css.match(/corner-shape:/g)).toHaveLength(1)
  expect(css).not.toContain('.EmptyBoundary')
})

test('独立空间配置不引入未选择的布局模式', () => {
  keep(
    rules('.Space', [contentLayout({ gap: '8px', padding: ['4px', '12px'] })]),
  )
  const css = compileCSS()
  expect(css).toContain('gap: 8px;')
  expect(css).toContain('padding: 4px 12px;')
  expect(css).not.toContain('display:')
  expect(css).not.toContain('align-items:')
  expect(css).not.toContain('justify-content:')
})

test('undefined 跳过；每个句柄仅修改自己的声明', () => {
  const first = rule('.Handles', 'color', 'red')
  handles.push(first)
  const second = rule('.Handles', 'color', 'blue')
  handles.push(second)
  handles.push(rule('.Handles', 'color', undefined))
  first.replace('green')
  expect(compileCSS()).toContain('color: green, blue;')
  second.remove()
  expect(compileCSS()).toContain('color: green;')
  expect(compileCSS()).not.toContain('color: blue;')
})

test('后续依赖提供同名函数时，也能替换已经解析过的旧定义', () => {
  const oldBody: Rules = [[undefined, 'result', '1px']]
  const newBody: Rules = [[undefined, 'result', '2px']]
  keep(
    rule(
      '.Direct',
      'width',
      cssFunction('--late-definition() returns <length>', oldBody)(),
    ),
  )
  keep(
    rule(
      '.Indirect',
      'width',
      token('1px', {
        onFirstScan: () => [
          [
            [condition('.Dependency')],
            'width',
            cssFunction('--late-definition() returns <length>', newBody)(),
          ],
        ],
      }),
    ),
  )
  const css = compileCSS()
  expect(css).toContain('result: 2px;')
  expect(css).not.toContain('result: 1px;')
})

test('同名变量注册按完整定义替换，不混入旧 initial-value', () => {
  const old = token(undefined, {
    name: 'registration-replacement',
    registration: { syntax: '<length>', inherits: true, initialValue: '7px' },
  })
  const next = token(undefined, {
    name: 'registration-replacement',
    registration: { syntax: '*', inherits: false },
  })
  keep(rule('.OldRegistration', 'width', old))
  keep(rule('.NewRegistration', 'width', next))
  const css = compileCSS()
  expect(css.match(/@property --registration-replacement/g)).toHaveLength(1)
  expect(css).toContain('syntax: "*";\ninherits: false;')
  expect(css).not.toContain('initial-value: 7px;')
})

test('完整 Creator 配置经句柄替换后编译新依赖，旧注册与资源退出', () => {
  const old = token('red', {
    name: 'creator-old-color',
    registration: { syntax: '<color>', inherits: false, initialValue: 'red' },
  })
  const next = token('blue', {
    name: 'creator-new-color',
    registration: { syntax: '<color>', inherits: false, initialValue: 'blue' },
  })
  const handle = keep(
    rule(
      '.CompleteCreator',
      $boxShadow,
      shadowValue({ x: '1px', y: '2px', color: old }),
    ),
  )
  const first = compileCSS()
  expect(first).toContain('box-shadow: 1px 2px var(--creator-old-color);')
  expect(first).toContain('@property --creator-old-color {')
  handle.replace(shadowValue({ x: '3px', y: '4px', color: next }))
  const second = compileCSS()
  expect(second).toContain('box-shadow: 3px 4px var(--creator-new-color);')
  expect(second).toContain('@property --creator-new-color {')
  expect(second).not.toContain('--creator-old-color')
  let calls = 0
  const child = {
    onFirstScan: (): Rules => [
      [[condition('.CreatorNewDependency')], 'width', '7px'],
    ],
    onCompile: (context, controller) => {
      calls++
      controller.setContent(context, '9px')
    },
  }
  handle.replace(shadowValue({ x: child, y: '4px', color: 'black' }))
  const third = compileCSS()
  expect(third).toContain('box-shadow: 9px 4px black;')
  expect(third).toContain('.CreatorNewDependency {\nwidth: 7px;\n}')
  expect(third).not.toContain('--creator-old-color')
  expect(third).not.toContain('--creator-new-color')
  expect(calls).toBe(1)
  handle.remove()
  const removed = compileCSS()
  expect(removed).not.toContain('.CompleteCreator')
  expect(removed).not.toContain('.CreatorNewDependency')
})

test('结构嵌套可以继承 Token 目标，不误判为局部分支数组', () => {
  const nestedTargetVariable = token(undefined, { name: 'nested-target' })
  const body: Rules = [
    [undefined, undefined, 1],
    [[condition('&:where(:hover)')], undefined, 2],
  ]
  keep(rule('.NestedTarget', nestedTargetVariable, body))
  const css = compileCSS()
  expect(css).toContain('--nested-target: 1;')
  expect(css).toMatch(/&:where\(:hover\)\s*\{\s*--nested-target:\s*2;/)
})
