/** 来源：2026-10-18 用户裁决，依赖跟随具体Variable对象，名称不激活定义；派生保留创建时复用。 */
import { describe, expect, test } from 'vitest'
import { parse } from 'postcss'
import { compileRules } from '../css-root'
import { variable, variableFrom, variableName } from '../variable'
import { declare } from '../operations/declare'
import { colorMix } from '../pieces/contents/functions/color-mix'
import { multiply } from '../pieces/contents/functions/calc'

describe('具体变量定义与名称分工', () => {
  test('Name字符串化用于拼接，但单独引用不激活定义', () => {
    let activated = 0
    const name = variableName('--surface')
    variable('red', { name, onActive: () => { activated++; return [] } })
    expect(String(name)).toBe('surface')
    expect(`${name}-line`).toBe('surface-line')
    const css = compileRules([[['.NameOnly'], 'color', name]])
    expect(css).toContain('var(--surface)')
    expect(css).not.toContain('--surface:')
    expect(activated).toBe(0)
  })

  test('引用具体对象不激活另一个同名对象', () => {
    let unused = 0
    const source = variable('red', 'isolated-color')
    variable('blue', { name: 'isolated-color', onActive: () => { unused++; return [] } })
    const css = compileRules([[['.ObjectOnly'], 'color', source]])
    expect(css).toContain('--isolated-color: red')
    expect(css).not.toContain('--isolated-color: blue')
    expect(unused).toBe(0)
  })

  test('variableFrom保留默认和状态，独立名称与显式等级只改变指定差异', () => {
    const source = variable({ default: '4px', hover: base => multiply(base, 2) }, { name: 'derive-source', priority: 3 })
    const copied = variableFrom(source, source.content)
    const changed = variableFrom(source, '7px', { name: 'derive-changed', priority: 0 })
    expect(copied.name).toBe(source.name)
    const copiedCSS = compileRules([[['.Copied'], 'width', copied]])
    expect(copiedCSS).toContain('--derive-source: 4px')
    expect(copiedCSS).toContain('calc(4px * 2)')
    source.config.defaultValue = '9px'
    source.config.states.clear()
    const snapshotCSS = compileRules([[['.Copied'], 'width', copied]])
    expect(snapshotCSS).toContain('--derive-source: 4px')
    expect(snapshotCSS).toContain('calc(4px * 2)')
    const overridden = variableFrom(source, source.content, { name: 'derive-states', states: { hover: '12px' } })
    const overriddenCSS = compileRules([[['.Overridden'], 'width', overridden]])
    expect(overriddenCSS).toContain('--derive-states: 9px')
    expect(overriddenCSS).toContain('--derive-states: 12px')
    expect(changed.priority).toBe(0)
    const css = compileRules([[['.Changed'], 'width', changed]])
    expect(css).toContain('--derive-changed: 7px')
    expect(css).toContain('calc(7px * 2)')
  })

  test('两个同名对象均消费时，各自状态只发布到自己的使用位置', () => {
    const first = variable({ default: 'red', hover: 'pink' }, { name: 'shared-state-name', address: '.IdentityFirst' })
    const second = variable({ default: 'blue', active: 'navy' }, { name: 'shared-state-name', address: '.IdentitySecond' })
    const css = compileRules([
      [['.IdentityFirst'], 'color', first],
      [['.IdentitySecond'], 'color', second],
      [['.NameRead'], 'color', first.name],
    ])
    const at = (selector: string) => parse(css).nodes.find(node => node.type === 'rule' && node.selector === selector)!.toString()
    expect(at('.IdentityFirst')).toContain('hover')
    expect(at('.IdentityFirst')).toContain('--shared-state-name: pink')
    expect(at('.IdentityFirst')).not.toContain('active')
    expect(at('.IdentitySecond')).toContain('active')
    expect(at('.IdentitySecond')).toContain('--shared-state-name: navy')
    expect(at('.IdentitySecond')).not.toContain('hover')
    expect(at('.NameRead')).not.toMatch(/hover|active|--shared-state-name:/)
  })

  test('派生的内容对象与生命周期配置有明确的调用位置', () => {
    const source = variable('4px', 'derive-content-source')
    let active = 0
    const resource = { onActive: () => { active++; return [] } }
    const waveOnly = { compileWaveIndex: 2 }
    const content = { toCSSString: () => '8px' }
    expect(variableFrom(source, resource).content).toBe(resource)
    expect(variableFrom(source, waveOnly).content).toBe(waveOnly)
    expect(variableFrom(source, content).content).toBe(content)
    const configured = variableFrom(source, { name: 'derive-active-config', onActive: resource.onActive })
    expect(compileRules([[['.Configured'], 'width', configured]])).toContain('--derive-active-config: 4px')
    expect(active).toBe(1)
    const empty = variableFrom(source, undefined, 'derive-empty')
    expect(empty.content).toBeUndefined()
  })

  test('普通转换函数返回依赖各自基础和共享强度的具体变量', () => {
    const strength = variable(0.18, 'object-line-strength')
    const line = (base: ReturnType<typeof variable>) => variable({ default: colorMix([base, strength], 'transparent') }, `${base.name}-line`)
    const first = variable('red', 'object-first')
    const second = variable('blue', 'object-second')
    const css = compileRules([[['.First'], 'color', line(first)], [['.Second'], 'color', line(second)],
    [['.Local'], ...declare(first, 'green')], [['.Local'], ...declare(strength, 0.4)]])
    expect(css).toContain('--object-first-line:')
    expect(css).toContain('--object-second-line:')
    expect(css).toContain('var(--object-first)')
    expect(css).toContain('var(--object-second)')
    expect(css).toContain('var(--object-line-strength)')
    expect(css).not.toContain('[object Object]')
  })
})
