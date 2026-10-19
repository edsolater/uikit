/** 内容生产函数只在编译时求值，输出协议不接受函数冒充文本。 */
import { whenSettled } from './when-settled'
import { expect, test, vi } from 'vitest'
import { compileRules } from '../css-root'
import { condition, media, functionDefinition } from '../condition'
import { createJSSContent, type JSSContent } from '../content'
import { value } from '../value'
import { valueList, valueSequence } from '../pieces/contents/atom-creators/list'
import { multiply } from '../pieces/contents/functions/calc'
import { key } from '../key'
import { referenceVariable, variable, variableName } from '../variable'
import { declare } from '../operations/declare'
import { modification } from '../modification'
import { animationName } from '../pieces/contents/atom-creators/animation'

test('未被消费的动态 Value 不执行，消费后输出内容', () => {
  const serialize = vi.fn(() => 'red')
  const content = value(createJSSContent(serialize))
  expect(serialize).not.toHaveBeenCalled()
  expect(compileRules([[[condition('.Probe')], 'color', content]])).toContain('color: red;')
  expect(serialize).toHaveBeenCalled()
})

test.each(['直接内容', 'Value', '嵌套数组', 'list', 'sequence', 'withContent', 'onCompile', '表达式', '自定义resolve', 'join'])('%s 中的普通生产函数在编译时输出结果', entry => {
  const produce = vi.fn((_unused?: unknown) => '3px')
  produce.toString = () => { throw new Error('禁止函数字符串化') }
  const contents = {
    直接内容: produce,
    Value: value(produce),
    嵌套数组: value([['1px', produce]]),
    list: valueList('1px', produce),
    sequence: valueSequence('1px', produce),
    withContent: value<() => string>(() => 'old').withContent(produce),
    onCompile: { onCompile(context, controller) { controller.setContent(context, produce) } } satisfies JSSContent,
    表达式: multiply(produce, 2),
    自定义resolve: value(produce, { dependencies: content => [content], toCSSString: (content, resolve) => resolve(content) }),
    join: 'ignored',
  }
  const target = entry === 'join' ? key('--producer-join', { join: () => produce }) : '--producer'
  expect(produce).not.toHaveBeenCalled()
  const rules: import('../rule').Rules = [[['.Producer'], target, contents[entry]]]
  if (entry === 'join') rules.push([['.Producer'], target, 'again'])
  const css = compileRules(rules)
  const expected = entry === '嵌套数组' || entry === 'list' ? '1px, 3px' : entry === 'sequence' ? '1px 3px' : entry === '表达式' ? 'calc(3px * 2)' : '3px'
  expect(css).toContain(`${entry === 'join' ? '--producer-join' : '--producer'}: ${expected};`)
  expect(produce).toHaveBeenCalled()
})

test('默认生产函数与状态 base 回调返回的生产内容保留资源和当地基础', () => {
  const source = variable(() => value(() => '4px'), {
    name: 'producer-default-state',
    states: { '&:hover': base => multiply(base, () => 2) },
    onActive: () => [[['.ProducerResource'], 'color', () => 'red']],
    registration: { syntax: '<length>', inherits: true, initialValue: () => '1px' },
  })
  const css = compileRules([[['.Producer'], 'width', source]])
  expect(css).toContain('--producer-default-state: 4px;')
  expect(css).toContain('--producer-default-state: calc(4px * 2);')
  expect(css).toContain('initial-value: 1px;')
  expect(css).toContain('color: red;')
})

test('生产函数返回另一生产函数仍可消费，自返函数明确报告循环', () => {
  expect(compileRules([[['.Chain'], 'width', () => () => '5px']])).toContain('width: 5px;')
  const produce = () => produce
  expect(() => compileRules([[['.Cycle'], 'width', value(produce)]])).toThrow(/循环|上限/)
})

test.each(['内容输出', 'Value输出', 'Key输出', 'Condition头', 'inherits', 'syntax'])('%s 返回或持有函数时拒绝，不执行也不字符串化', entry => {
  const invalid = vi.fn(() => { throw new Error('不应执行非法字段') })
  invalid.toString = () => { throw new Error('不应字符串化非法字段') }
  expect(() => {
    const source = variable('1px', { name: `invalid-function-${entry}`, registration: {
      // @ts-expect-error 静态注册字段拒绝函数，运行时同样应拒绝。
      syntax: entry === 'syntax' ? invalid : '<length>',
      // @ts-expect-error inherits 只接受 boolean。
      inherits: entry === 'inherits' ? invalid : true,
    } })
    const content = entry === '内容输出'
      // @ts-expect-error 输出协议只能返回文本或 undefined。
      ? createJSSContent(() => invalid)
      : entry === 'Value输出'
        // @ts-expect-error Value 输出协议同样拒绝函数。
        ? value('1px', { toCSSString: () => invalid }) : source
    const target = entry === 'Key输出'
      ? { toCSSString: () => invalid } : 'width'
    // @ts-expect-error Condition 头是静态文本。
    const path = entry === 'Condition头' ? [condition(invalid)] : ['.Invalid']
    // @ts-expect-error 运行时验证非法 Key 输出，同步保留公开类型约束。
    compileRules([[path, target, content]])
  }).toThrow(/CSS|Key|Condition|registration|注册|syntax|inherits/)
  expect(invalid).not.toHaveBeenCalled()
})

test.each(['media', 'functionDefinition', 'animationName'])('%s 的固定文本参数拒绝函数，插值前报错', entry => {
  const invalid = vi.fn(() => { throw new Error('不应执行静态名称') })
  invalid.toString = () => { throw new Error('不应字符串化静态名称') }
  expect(() => {
    if (entry === 'media') {
      // @ts-expect-error 查询必须是固定文本。
      media(invalid)
    } else if (entry === 'functionDefinition') {
      // @ts-expect-error 函数签名必须是固定文本。
      functionDefinition(invalid)
    } else {
      // @ts-expect-error 动画名称必须是固定文本。
      compileRules([[['.Animation'], 'animation-name', animationName(invalid, [])]])
    }
  }).toThrow(/必须是字符串/)
  expect(invalid).not.toHaveBeenCalled()
})

test('状态回调收到默认生产函数求得的基础值，而不是函数本身', () => {
  const material = variable(() => '4px', {
    name: 'producer-base-value',
    states: { '&:hover': base => `${Number.parseFloat(String(base)) * 2}px` },
  })
  const css = compileRules([[['.BaseValue'], 'width', material]])
  expect(css).toContain('--producer-base-value: 4px;')
  expect(css).toContain('--producer-base-value: 8px;')
})

test('resolve 未声明的生产函数依赖时明确报错，不在输出时执行', () => {
  const produce = vi.fn(() => '9px')
  produce.toString = () => { throw new Error('不应字符串化未编译函数') }
  const content = value(produce, { dependencies: [], toCSSString: (input, resolve) => resolve(input) })
  expect(() => compileRules([[['.Uncompiled'], 'width', content]])).toThrow(/未编译|dependencies/)
  expect(produce).not.toHaveBeenCalled()
})

test.each([false, true])('天然材料的 Key 输出函数时，值引用与注册都在插值前拒绝，registration=%s', registered => {
  const invalid = vi.fn(() => { throw new Error('不应执行非法天然属性名') })
  invalid.toString = () => { throw new Error('不应字符串化非法天然属性名') }
  const material = { key: { toCSSString: () => invalid }, content: '1px',
    registration: registered ? { syntax: '<length>', inherits: true } : undefined }
  expect(() => {
    // @ts-expect-error 天然材料的属性名输出同样只能是字符串。
    const content = referenceVariable(material)
    compileRules([[['.NaturalKey'], 'width', content]])
  }).toThrow(/JSSKey|CSS Key/)
  expect(invalid).not.toHaveBeenCalled()
})

test('根默认生产函数独立提供基础，显式局部值及状态不被替换', () => {
  const material = variable(() => '4px', {
    name: 'expanded-unused-default', states: { '&:hover': base => `${parseFloat(String(base)) * 2}px` },
  })
  const css = compileRules([[['.Explicit'], ...declare(material, '6px')], [['.Explicit'], 'width', material]])
  expect(css).toMatch(/:root\s*\{[^}]*--expanded-unused-default: 4px;/)
  expect(css).toContain('--expanded-unused-default: 6px;')
  expect(css).toContain('--expanded-unused-default: 12px;')
})

test('纯名称内容只输出引用，不建立具体对象的当地依赖', () => {
  let phase = 'first'
  const first = variableName('expanded-dependency-first')
  const later = variableName('expanded-dependency-later')
  const advance = () => { phase = 'later'; return undefined }
  const recipe = {
    get dependencies() { return [phase === 'first' ? first : later, advance] },
    toCSSString: (resolve?: import('../content').JSSContentResolver) => resolve?.(first) ?? resolve?.(later),
  }
  const material = variable(recipe, { name: 'expanded-dependency-recipe' })
  const css = compileRules([[['.Parent'], '--expanded-dependency-first', '3px'], [['.Parent'], 'width', material], [['.Child'], '--expanded-dependency-first', '7px']])
  expect(css).toContain('--expanded-dependency-recipe: var(--expanded-dependency-first);')
  expect(css).not.toMatch(/\.Child\s*\{[^}]*--expanded-dependency-recipe:/)
})

test('同一显式声明的默认基础只展开一次，多个当地消费者沿用该基础', () => {
  let available = true
  const material = variable(() => {
    if (!available) throw new Error('同一声明基础不应被消费入口重复求值')
    available = false
    return '4px'
  }, { name: 'expanded-shared-default', states: { '&:hover': base => `${parseFloat(String(base)) * 2}px` } })
  const css = compileRules([[['.SharedDefault'], ...declare(material)], [['.SharedDefault'], 'width', material], [['.SharedDefault'], 'height', material.name]])
  expect(css).toContain('--expanded-shared-default: 4px;')
  expect(css).toContain('--expanded-shared-default: 8px;')
  expect(css).toContain('width: var(--expanded-shared-default);')
  expect(css).toContain('height: var(--expanded-shared-default);')
})

test.each(['函数', 'onCompile'])('展开成常量的%s内容不额外物化当地声明', entry => {
  const content = entry === '函数' ? () => '4px' : { onCompile(context: import('../content').JSSCompileContext, controller: import('../compiler/ast-controller').ASTController) { controller.setContent(context, '4px') } }
  const material = variable(value(content), { name: `expanded-constant-${entry}` })
  const css = compileRules([[['.ConstantConsumer'], 'width', material]])
  expect(css).toContain(`--expanded-constant-${entry}: 4px;`)
  const consumer = css.match(/\.ConstantConsumer\s*\{([^}]*)\}/)?.[1]
  expect(consumer).toContain(`width: var(--expanded-constant-${entry});`)
  expect(consumer).not.toContain(`--expanded-constant-${entry}:`)
})

test('编译波前访问过依赖后，onCompile 更新的依赖仍在完成阶段实际编译', () => {
  const produce = () => 'red'
  const input: JSSContent = { compileWaveIndex: 1, dependencies: [],
    onCompile() { input.dependencies = [produce] },
    toCSSString: resolve => resolve?.(produce),
  }
  expect(compileRules([[['.ChangedDependencies'], 'color', input]])).toContain('color: red;')
})

test('明确的undefined局部基础不输出，根默认仍独立提供基础', () => {
  const material = variable(() => '4px', { name: 'expanded-explicit-empty' })
  const css = compileRules([[['.EmptyBase'], ...declare(material, undefined)], [['.EmptyBase'], 'width', material]])
  expect(css).toContain('width: var(--expanded-explicit-empty);')
  expect(css).toMatch(/:root\s*\{[^}]*--expanded-explicit-empty: 4px;/)
  expect(css.match(/\.EmptyBase\s*\{([^}]*)\}/)?.[1]).not.toContain('--expanded-explicit-empty:')
})

test('消费输入身份替换后，自动投影读取新的角色展开结果', () => {
  let fresh = false
  const material = variable(() => fresh ? '8px' : '4px', { name: 'expanded-input-replacement' })
  const css = compileRules([[['.InputReplacement'], 'width', material], [[], undefined, whenSettled(controller => {
    fresh = true
    controller.search({ key: 'width' })[0].content = value(material)
    return true
  })]])
  expect(css).toContain('--expanded-input-replacement: 8px;')
  expect(css).not.toContain('--expanded-input-replacement: 4px;')
})

test.each(['基数', '另一个引用', '同址固定'])('原消费重访或显式接管后撤销旧联动与资源：%s', mode => {
  let factor = 2
  let childDone = false
  const source = variable('1px', 'expanded-linked-refresh-source')
  const another = variable('2px', 'expanded-linked-refresh-another')
  let selected = source
  const sourceDeclaration = declare(source, '7px')
  const material = variable(() => ({
    onActive: context => selected === source && context.conditionPath.targetConditionPath.some(item => item.header === '.RefreshChild')
      ? [[['.StaleLinkedResource'], 'display', 'block']] : [],
    onCompile(context, controller) {
      controller.setContent(context, multiply(selected, factor))
      if (context.conditionPath.targetConditionPath.some(item => item.header === '.RefreshChild')) childDone = true
    } }), { name: 'expanded-linked-refresh-derived' })
  const css = compileRules([
    [['.RefreshParent'], 'width', material], [['.RefreshChild'], ...sourceDeclaration], [['.RefreshChild'], ...declare(another, '11px')],
    [[], undefined, whenSettled(controller => {
      if (!childDone) return false
      if (mode === '同址固定') {
        const anchor = controller.search({ key: source.key }).find(node => node.content === sourceDeclaration[1])!
        controller.insert({ before: anchor, conditionPath: anchor.conditionPath }, declare(material, 20), { owner: anchor })
        return true
      }
      factor = 3
      if (mode === '另一个引用') selected = another
      controller.search({ key: 'width' })[0].content = value(material)
      return true
    })],
  ])
  const child = css.match(/\.RefreshChild\s*\{([^}]*)\}/)?.[1]
  if (mode === '同址固定') expect(child).toContain('--expanded-linked-refresh-derived: 20;')
  else {
    expect(css).not.toContain(' * 2)')
    const formula = `--expanded-linked-refresh-derived: calc(var(${selected.toCSSString()}) * 3);`
    expect(css.match(/:root\s*\{([^}]*)\}/)?.[1]).toContain(formula)
    expect(child).toContain(formula)
  }
  if (mode !== '基数') expect(css).not.toContain('.StaleLinkedResource')
  expect(css.match(/\.RefreshParent\s*\{([^}]*)\}/)?.[1]).not.toContain('--expanded-linked-refresh-derived:')
})

test('状态联动跟随其真实局部声明的基础重访，不借其他原生消费者代表来源', () => {
  let fresh = false
  let grandchildDone = false
  const source = variable('1px', 'expanded-state-origin-source')
  const material = variable('1px', { name: 'expanded-state-origin-derived', states: { '&[data-active]': base => multiply(source, parseFloat(String(base))) } })
  /**
   * 提供重访前后的当地基础，并在Grandchild实际编译后开放后续重访步骤。
   */
  const produceLocalBase = () => ({ onCompile(context: import('../content').JSSCompileContext, controller: import('../compiler/ast-controller').ASTController) {
    controller.setContent(context, fresh ? '6px' : '5px')
    if (context.conditionPath.targetConditionPath.some(item => item.header === '.OriginGrandchild')) grandchildDone = true
  } })
  const declaration = declare(material, produceLocalBase)
  const css = compileRules([
    [['.OriginParent'], 'width', material], [['.OriginParent', '.OriginChild'], ...declaration],
    [['.OriginParent', '.OriginChild'], 'width', material],
    [['.OriginParent', '.OriginChild', '.OriginGrandchild'], ...declare(source, '11px')],
    [[], undefined, whenSettled(controller => {
      if (!grandchildDone) return false
      fresh = true
      controller.nodes().find(node => node.content === declaration[1])!.compileRevision++
      return true
    })],
  ])
  const grandchild = css.match(/\.OriginGrandchild\s*\{([\s\S]*?)\n\}/)?.[1]
  expect(grandchild).toContain('--expanded-state-origin-derived: calc(var(--expanded-state-origin-source) * 6);')
  expect(grandchild).not.toContain(' * 5)')
  const parent = css.match(/\.OriginParent\s*\{([\s\S]*?)\n\}/)?.[1]
  expect(parent).toContain('--expanded-state-origin-derived: calc(var(--expanded-state-origin-source) * 1);')
  expect(css.match(/:root\s*\{([^}]*)\}/)?.[1]).toContain('--expanded-state-origin-derived: 1px;')
})


test('可调用内容对象按内容协议消费，不调用函数体', () => {
  const callable = Object.assign(() => { throw new Error('不能执行内容对象') }, { toCSSString: () => '7px' })
  const css = compileRules([[['.Callable'], 'width', value(callable)]])
  expect(css).toContain('width: 7px;')
  const material = variable(callable, { name: 'producer-callable-material', states: { '&:hover': callable } })
  const materialCSS = compileRules([[['.Callable'], 'width', material]])
  expect(materialCSS).toContain('--producer-callable-material: 7px;')
  expect(materialCSS).toContain('&:hover {')
})


test('Modification领域拒绝函数键，诊断不执行或字符串化', () => {
  const invalid = vi.fn(() => { throw new Error('不应执行非法键') })
  invalid.toString = () => { throw new Error('不应字符串化非法键') }
  // @ts-expect-error 领域标识不能是函数。
  expect(() => modification({ type: invalid, detail: {} })).toThrow('type 必须')
  expect(invalid).not.toHaveBeenCalled()
})
