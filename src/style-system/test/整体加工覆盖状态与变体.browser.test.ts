/** 来源：adjust 对完整定义的最终结果统一加工，固定值与规则均不能绕过加工。 */
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { add, adjust, condition, declare, key, mapVariableRules, modification, modify, multiply, oklch, variable, variableFrom } from '../index'
import { compileRules } from '../css-root'
import { whenSettled } from './when-settled'

afterEach(() => document.body.replaceChildren())

test.each(['独用', '来源先用', '映射先用', '显式来源声明'])('同名映射遵守已有声明与层叠，%s不形成CSS自引用', mode => {
  const source = variable(10, { name: 'same-name-mapping', address: '.SameNameMap', states: { '&[data-state]': base => add(base, 3) } })
  const mapped = mapVariableRules(source, current => multiply(current, 2))
  const sourceRule: Parameters<typeof compileRules>[0][number] = [['.SourceReader'], 'z-index', source]
  const mappedRule: Parameters<typeof compileRules>[0][number] = [['.MappedReader'], 'z-index', mapped]
  const inputs: Parameters<typeof compileRules>[0] = mode === '来源先用' ? [sourceRule, mappedRule]
    : mode === '映射先用' ? [mappedRule, sourceRule]
    : mode === '显式来源声明' ? [[['.SameNameMap'], ...declare(source, 30)], mappedRule] : [mappedRule]
  const css = compileRules(inputs)
  document.body.appendChild(document.createElement('style')).textContent = css
  const home = document.body.appendChild(document.createElement('section'))
  home.className = 'SameNameMap'
  const reader = home.appendChild(document.createElement('div'))
  reader.className = 'MappedReader'
  expect(getComputedStyle(reader).zIndex).toBe(mode === '来源先用' ? '10' : mode === '显式来源声明' ? '30' : '20')
  home.dataset.state = ''
  expect(getComputedStyle(reader).zIndex).toBe(mode === '来源先用' ? '13' : mode === '显式来源声明' ? '33' : '26')
})

test.each([false, true])('映射配置覆盖自己的根据地、状态与变体，保留同名=%s', sameName => {
  const source = variable('red', {
    name: 'override-mapping-source', address: '.OldMappingHome',
    states: { '&[data-state]': 'blue' }, variants: { fixed: 'gold', own: { default: 'orange', '&[data-state]': 'purple' } },
  })
  const mapped = mapVariableRules(source, current => oklch(current, { alpha: 0.5 }), {
    ...(sameName ? {} : { name: 'override-mapping-result' }), address: '.NewMappingHome',
    states: { '&[data-state]': 'green' }, variants: { fixed: 'pink' },
  })
  const css = compileRules([
    [['.MapResult'], 'color', mapped], [['.MapFixed'], 'color', mapped.variant('fixed')],
    [['.MapOwn'], 'color', mapped.variant('own')],
  ])
  document.body.appendChild(document.createElement('style')).textContent = css
  const home = document.body.appendChild(document.createElement('section'))
  home.className = 'NewMappingHome'
  const readers = ['MapResult', 'MapFixed', 'MapOwn'].map(className => {
    const reader = home.appendChild(document.createElement('div'))
    reader.className = className
    return reader
  })
  const reference = document.body.appendChild(document.createElement('div'))
  reference.style.color = 'oklch(from red l c h / 0.5)'
  expect(getComputedStyle(readers[0]).color).toBe(getComputedStyle(reference).color)
  expect(getComputedStyle(readers[1]).color).toBe('rgb(255, 192, 203)')
  reference.style.color = 'oklch(from orange l c h / 0.5)'
  expect(getComputedStyle(readers[2]).color).toBe(getComputedStyle(reference).color)
  home.dataset.state = ''
  readers.forEach(reader => expect(getComputedStyle(reader).color).toBe('rgb(0, 128, 0)'))
})

test('不同名映射的显式状态在来源同一根据地覆盖自动映射', () => {
  const source = variable('red', { name: 'state-override-source', address: '.StateOverride', states: { '&[data-state]': 'blue' } })
  const mapped = mapVariableRules(source, current => oklch(current, { alpha: 0.5 }), {
    name: 'state-override-result', states: { '&[data-state]': 'green' },
  })
  document.body.appendChild(document.createElement('style')).textContent = compileRules([[['.StateOverride'], 'color', mapped]])
  const reader = document.body.appendChild(document.createElement('div'))
  reader.className = 'StateOverride'
  reader.dataset.state = ''
  expect(getComputedStyle(reader).color).toBe('rgb(0, 128, 0)')
})

test('映射的显式状态回调基于当前映射结果，保留来源有效声明', () => {
  const source = variable(10, { name: 'mapped-state-basis-source', address: '.MappedStateBasis' })
  const mapped = mapVariableRules(source, current => multiply(current, 2), {
    name: 'mapped-state-basis-result', states: { '&[data-state]': base => multiply(base, 3) },
  })
  document.body.appendChild(document.createElement('style')).textContent = compileRules([
    [['.MappedStateBasis'], ...declare(source, 30)], [['.MappedStateBasis'], 'z-index', mapped],
  ])
  const reader = document.body.appendChild(document.createElement('div'))
  reader.className = 'MappedStateBasis'
  expect(getComputedStyle(reader).zIndex).toBe('60')
  reader.dataset.state = ''
  expect(getComputedStyle(reader).zIndex).toBe('180')
})

test('根地址两种写法等价，映射读取来源当前声明', () => {
  const source = variable(10, 'root-alias-mapping-source')
  const mapped = mapVariableRules(source, current => multiply(current, 2), { name: 'root-alias-mapping-result', address: ':root' })
  document.body.appendChild(document.createElement('style')).textContent = compileRules([
    [[':root'], ...declare(source, 30)], [['.RootAliasMapping'], 'z-index', mapped],
  ])
  const reader = document.body.appendChild(document.createElement('div'))
  reader.className = 'RootAliasMapping'
  expect(getComputedStyle(reader).zIndex).toBe('60')
})

test('映射结果换基础与显式赋值不重放旧加工，状态及变体保留已加工结果', () => {
  const source = variable(10, {
    name: 'ordinary-map-source', address: '.OrdinaryMap',
    states: { '&[data-relative]': base => add(base, 3), '&[data-fixed]': 7 }, variants: { fixed: 7 },
  })
  const mapped = mapVariableRules(source, current => multiply(current, 2))
  const copied = variableFrom(mapped, 50, 'ordinary-map-copy')
  const high = mapVariableRules(source, current => multiply(current, 2), { name: 'ordinary-map-priority', priority: 7 }).variant('fixed')
  const low = variable(99, { name: high.name, priority: 6 })
  const inputs: Parameters<typeof compileRules>[0] = [
    [['.OrdinaryMap'], ...declare(high)], [['.OrdinaryMap'], ...declare(low)],
    ...[mapped, copied, high].map((target, index): Parameters<typeof compileRules>[0][number] => [[`.OrdinaryReader${index}`], 'z-index', target]),
  ]
  const style = document.body.appendChild(document.createElement('style'))
  style.textContent = compileRules(inputs)
  const home = document.body.appendChild(document.createElement('section'))
  home.className = 'OrdinaryMap'
  const readers = [0, 1, 2].map(index => {
    const reader = home.appendChild(document.createElement('div'))
    reader.className = `OrdinaryReader${index}`
    return reader
  })
  expect(readers.map(reader => getComputedStyle(reader).zIndex)).toEqual(['20', '50', '14'])
  style.textContent = compileRules([...inputs, [['.OrdinaryMap'], ...declare(mapped, 70)]])
  expect(readers.map(reader => getComputedStyle(reader).zIndex)).toEqual(['70', '50', '14'])
  home.dataset.relative = ''
  expect(readers.map(reader => getComputedStyle(reader).zIndex)).toEqual(['26', '26', '20'])
  home.removeAttribute('data-relative')
  home.dataset.fixed = ''
  expect(readers.map(reader => getComputedStyle(reader).zIndex)).toEqual(['14', '14', '14'])
})

test.each([{ mode: 'from', title: '换基础' }, { mode: 'map', title: '映射规则' }])('$title继承注册的数值初值与不继承语义，显式清除或覆盖后按新配置计算', ({ mode }) => {
  const source = variable(2, {
    name: `registered-source-${mode}`, address: '.RegistrationHome',
    registration: { syntax: '<number>', inherits: false, initialValue: 7 },
  })
  const options = [
    { name: `registered-inherited-${mode}` },
    { name: `registered-cleared-${mode}`, registration: undefined },
    { name: `registered-overridden-${mode}`, registration: { syntax: '<number>', inherits: true, initialValue: 11 } },
  ]
  const targets = options.map(config => mode === 'from' ? variableFrom(source, 'invalid', config) : mapVariableRules(source, () => 'invalid', config))
  document.body.appendChild(document.createElement('style')).textContent = compileRules(targets.map((target, index) => [[`.RegistrationReader${index}`], 'z-index', target]))
  const samples = targets.map((target, index) => {
    const home = document.body.appendChild(document.createElement('section'))
    home.className = `RegistrationHome RegistrationReader${index}`
    const child = home.appendChild(document.createElement('div'))
    child.className = `RegistrationReader${index}`
    return { target, home, child }
  })
  expect(samples.map(({ home }) => getComputedStyle(home).zIndex)).toEqual(['7', 'auto', '11'])
  samples.forEach(({ target, home }) => home.style.setProperty(target.toCSSString(), '9'))
  expect(samples.map(({ home }) => getComputedStyle(home).zIndex)).toEqual(['9', '9', '9'])
  expect(samples.map(({ child }) => getComputedStyle(child).zIndex)).toEqual(['7', '9', '9'])
})

test.each([{ mode: 'from', title: '换基础' }, { mode: 'map', title: '映射规则' }])('$title继承最早编译波，状态读取已求得的基础值', ({ mode }) => {
  let ready = false
  let consumedTooEarly = false
  const source = variable(() => { consumedTooEarly ||= !ready; return ready ? 7 : 3 }, {
    name: `wave-source-${mode}`, address: '.WaveProbe', compileWaveIndex: 2,
    states: { '&[data-state]': base => Number.parseFloat(String(base)) + 3 },
  })
  const target = mode === 'from' ? variableFrom(source, source.content) : mapVariableRules(source, current => multiply(current, 2))
  const style = document.body.appendChild(document.createElement('style'))
  style.textContent = compileRules([
    [['.WaveProbe'], 'z-index', target],
    [[], undefined, { compileWaveIndex: 1, onCompile(context, controller) { ready = true; controller.setContent(context, undefined) } }],
  ])
  expect(consumedTooEarly).toBe(false)
  const reader = document.body.appendChild(document.createElement('div'))
  reader.className = 'WaveProbe'
  const factor = mode === 'from' ? 1 : 2
  expect(getComputedStyle(reader).zIndex).toBe(String(7 * factor))
  reader.dataset.state = ''
  expect(getComputedStyle(reader).zIndex).toBe(String(10 * factor))
})

test.each([false, true])('天然材料映射保留声明等级、共同依赖与按需资源，另起名称=%s', renamed => {
  const shared = variable(3, 'natural-map-shared')
  const onActive = vi.fn(() => [[['.NaturalResource'], 'opacity', 0.5]] as Parameters<typeof compileRules>[0])
  const source = {
    key: { ...key('--natural-map-source'), priority: 4 }, content: 10, address: '.NaturalHome', declarations: [shared],
    onActive,
  }
  const mapped = mapVariableRules(source, current => multiply(current, 2), renamed ? 'natural-map-renamed' : undefined)
  const competitor = variable(99, { name: mapped.name, priority: 3 })
  const sheet = document.body.appendChild(document.createElement('style'))
  sheet.textContent = compileRules([
    [['.NaturalHome'], ...declare(mapped)], [['.NaturalHome'], ...declare(competitor)], [['.NaturalHome'], 'z-index', mapped],
  ])
  const reader = document.body.appendChild(document.createElement('div'))
  reader.className = 'NaturalHome NaturalResource'
  reader.style.marginLeft = `calc(var(${shared.toCSSString()}, 0) * 1px)`
  const style = getComputedStyle(reader)
  expect(style.zIndex).toBe('20')
  expect(style.marginLeft).toBe('3px')
  expect(style.opacity).toBe('0.5')
  onActive.mockClear()
  sheet.textContent = compileRules([[['.NaturalHome'], 'z-index', mapped]])
  expect(getComputedStyle(reader).zIndex).toBe('20')
  expect(onActive).toHaveBeenCalledTimes(1)
})

test('整份颜色加工覆盖默认、固定状态、规则状态和变体，来源不变且不重复加工', async () => {
  const source = variable('oklch(0.6 0.1 240)', {
    name: 'whole-adjust-source',
    address: [condition('.AdjustProbe')],
    states: {
      hover: 'oklch(0.4 0.1 200)',
      '&[data-active]': base => oklch(base, { alpha: current => multiply(current, 0.8) }),
    },
    variants: {
      fixed: 'oklch(0.3 0.1 140)',
      soft: base => oklch(base, { lightness: current => multiply(current, 0.5) }),
    },
  })
  const result = adjust(source, modification({ type: 'color', detail: { alpha: current => multiply(current, 0.5) } }))
  const fixed = result.variant('fixed')
  const soft = result.variant('soft')
  document.body.appendChild(document.createElement('style')).textContent = compileRules([
    [['.AdjustProbe'], 'color', result],
    [['.AdjustProbe'], 'background-color', fixed],
    [['.AdjustProbe'], 'border-color', soft],
    [['.AdjustProbe'], 'outline-color', source],
  ])
  const element = document.body.appendChild(document.createElement('button'))
  element.className = 'AdjustProbe'
  element.textContent = '整体加工'
  const colors = () => {
    const style = getComputedStyle(element)
    return [style.color, style.backgroundColor, style.borderTopColor, style.outlineColor]
  }
  expect(colors()).toEqual([
    'oklch(0.6 0.1 240 / 0.5)', 'oklch(0.3 0.1 140 / 0.5)',
    'oklch(0.3 0.1 240 / 0.5)', 'oklch(0.6 0.1 240)',
  ])
  await userEvent.hover(element)
  expect(colors()).toEqual([
    'oklch(0.4 0.1 200 / 0.5)', 'oklch(0.4 0.1 200 / 0.5)',
    'oklch(0.4 0.1 200 / 0.5)', 'oklch(0.4 0.1 200)',
  ])
  await userEvent.unhover(element)
  element.dataset.active = ''
  expect(colors()).toEqual([
    'oklch(0.6 0.1 240 / 0.4)', 'oklch(0.3 0.1 140 / 0.4)',
    'oklch(0.3 0.1 240 / 0.4)', 'oklch(0.6 0.1 240 / 0.8)',
  ])
  delete element.dataset.active
  expect(colors()[0]).toBe('oklch(0.6 0.1 240 / 0.5)')
})

test('天然来源仍可直接加工，连续加工按顺序累计而不改写来源', () => {
  const source = { key: key('--whole-adjust-natural'), content: 'oklch(0.6 0.1 240)' }
  const half = modification({ type: 'color', detail: { alpha: current => multiply(current, 0.5) } })
  const first = adjust(source, half)
  const second = adjust(first, half)
  document.body.appendChild(document.createElement('style')).textContent = compileRules([
    [['.NaturalAdjust'], 'color', first], [['.NaturalAdjust'], 'background-color', second],
  ])
  const element = document.body.appendChild(document.createElement('div'))
  element.className = 'NaturalAdjust'
  expect(getComputedStyle(element).color).toBe('oklch(0.6 0.1 240 / 0.5)')
  expect(getComputedStyle(element).backgroundColor).toBe('oklch(0.6 0.1 240 / 0.25)')
  expect(source.content).toBe('oklch(0.6 0.1 240)')
})

test.each(['显式声明', 'CSS运行时覆盖'])('调整引用来源根据地当前值，%s改蓝后无需重建调整结果', mode => {
  const source = variable('red', 'current-adjust-source')
  const result = adjust(source, modification({ type: 'color', detail: { alpha: 0.5 } }))
  document.body.appendChild(document.createElement('style')).textContent = compileRules([
    ...(mode === '显式声明' ? [[[':root'], ...declare(source, 'blue')] as Parameters<typeof compileRules>[0][number]] : []),
    [['.CurrentAdjustSource'], 'color', result],
  ])
  const element = document.body.appendChild(document.createElement('div'))
  element.className = 'CurrentAdjustSource'
  try {
    if (mode === 'CSS运行时覆盖') document.documentElement.style.setProperty(source.toCSSString(), 'blue')
    expect(getComputedStyle(element).color).toBe('oklch(0.451981 0.31321 264.051 / 0.5)')
  } finally {
    document.documentElement.style.removeProperty(source.toCSSString())
  }
})

test('完整修改使用变体根据地的有效新定义，其他同名对象按优先级覆盖', () => {
  const source = variable('red', { name: 'variant-choice-source', address: '.VariantChoice', variants: { line: 'green' } })
  const line = source.variant('line')
  const stronger = variable('black', { name: line.name, address: '.VariantChoice', priority: line.priority + 1 })
  const compile = (withStronger: boolean) => compileRules([
    [['.VariantChoice'], ...declare(line, 'blue')],
    [['.VariantChoice'], ...declare(line, 'gold')],
    ...(withStronger ? [[['.VariantChoice'], ...declare(stronger, 'black')] as Parameters<typeof compileRules>[0][number]] : []),
    [['.VariantChoice'], ...modify(source, modification({ type: 'color', detail: { alpha: 0.5 } }))],
    [['.VariantChoice'], 'color', line],
  ])
  const style = document.body.appendChild(document.createElement('style'))
  const element = document.body.appendChild(document.createElement('div'))
  element.className = 'VariantChoice'
  const reference = document.body.appendChild(document.createElement('div'))
  reference.style.color = 'oklch(from gold l c h / 0.5)'
  style.textContent = compile(false)
  expect(getComputedStyle(element).color).toBe(getComputedStyle(reference).color)
  style.textContent = compile(true)
  expect(getComputedStyle(element).color).toBe('oklch(0 0 0 / 0.5)')
})

test.each(['variableFrom', 'variant', 'adjust'])('%s 沿用来源根据地，状态由该主体控制而不从消费处猜地址', async kind => {
  const source = variable('red', { name: `inherited-home-${kind}`, address: '.InheritedHome', states: { hover: 'blue' }, variants: { line: 'gold' } })
  const result = kind === 'variableFrom' ? variableFrom(source, 'green')
    : kind === 'variant' ? source.variant('line')
    : adjust(source, modification({ type: 'color', detail: { alpha: 0.5 } }))
  document.body.appendChild(document.createElement('style')).textContent = compileRules([[['.HomeConsumer'], 'color', result]])
  const parent = document.body.appendChild(document.createElement('button'))
  parent.className = 'InheritedHome'
  const child = parent.appendChild(document.createElement('span'))
  child.className = 'HomeConsumer'
  child.textContent = '根据地后代'
  const outside = document.body.appendChild(document.createElement('span'))
  outside.className = 'HomeConsumer'
  outside.style.color = `var(${result.toCSSString()}, black)`
  outside.textContent = '根据地之外'
  expect(getComputedStyle(child).color).not.toBe(getComputedStyle(outside).color)
  await userEvent.hover(parent)
  expect(getComputedStyle(child).color).toBe(kind === 'adjust' ? 'oklch(0.451981 0.31321 264.051 / 0.5)' : 'rgb(0, 0, 255)')
  expect(getComputedStyle(outside).color).toBe('rgb(0, 0, 0)')
  await userEvent.unhover(parent)
})

test('晚到的变体基础替换后，完整修改采用新的有效定义', () => {
  const source = variable('red', { name: 'late-variant-source', address: '.LateVariant', variants: { line: 'green' } })
  const line = source.variant('line')
  const operation = modify(source, modification({ type: 'color', detail: { alpha: 0.5 } }))
  const css = compileRules([
    [['.LateVariant'], ...declare(line, 'blue')], [['.LateVariant'], ...operation],
    [['.LateVariant'], 'color', line],
    [[], undefined, whenSettled(controller => {
      const anchor = controller.search({ key: source.key }).find(node => node.content === operation[1])!
      controller.insert({ before: anchor, conditionPath: anchor.conditionPath }, declare(line, 'gold'), { owner: anchor })
      return true
    })],
  ])
  document.body.appendChild(document.createElement('style')).textContent = css
  const element = document.body.appendChild(document.createElement('div'))
  element.className = 'LateVariant'
  const reference = document.body.appendChild(document.createElement('div'))
  reference.style.color = 'oklch(from gold l c h / 0.5)'
  expect(getComputedStyle(element).color).toBe(getComputedStyle(reference).color)
})

test('晚到后写的新绑定截断先前修改及其变体加工', () => {
  const source = variable('red', { name: 'late-binding-source', address: '.LateBinding', variants: { line: 'green' } })
  const line = source.variant('line')
  const operation = modify(source, modification({ type: 'color', detail: { alpha: 0.5 } }))
  const css = compileRules([
    [['.LateBinding'], ...operation], [['.LateBinding'], 'color', source], [['.LateBinding'], 'background-color', line],
    [[], undefined, whenSettled(controller => {
      const anchor = controller.search({ key: source.key }).find(node => node.content === operation[1])!
      controller.insert({ after: anchor, conditionPath: anchor.conditionPath }, declare(source, 'gold'), { owner: anchor })
      anchor.compileRevision++
      return true
    })],
  ])
  document.body.appendChild(document.createElement('style')).textContent = css
  const element = document.body.appendChild(document.createElement('div'))
  element.className = 'LateBinding'
  expect(getComputedStyle(element).color).toBe('rgb(255, 215, 0)')
  expect(getComputedStyle(element).backgroundColor).toBe('rgb(0, 128, 0)')
})

test('从已加工定义复用新基础不重放映射，保留已加工的状态值', async () => {
  const source = variable('red', { name: 'from-adjust-source', address: '.FromAdjust', states: { hover: 'blue' }, variants: { line: 'gold' } })
  const adjusted = adjust(source, modification({ type: 'color', detail: { alpha: current => multiply(current, 0.5) } }))
  const copied = variableFrom(adjusted, 'green', 'from-adjust-new')
  document.body.appendChild(document.createElement('style')).textContent = compileRules([[['.FromAdjust'], 'color', copied]])
  const element = document.body.appendChild(document.createElement('button'))
  element.className = 'FromAdjust'
  element.textContent = '独立新基础'
  const reference = document.body.appendChild(document.createElement('div'))
  reference.style.color = 'green'
  expect(getComputedStyle(element).color).toBe(getComputedStyle(reference).color)
  await userEvent.hover(element)
  expect(getComputedStyle(element).color).toBe('oklch(0.451981 0.31321 264.051 / 0.5)')
  await userEvent.unhover(element)
})
