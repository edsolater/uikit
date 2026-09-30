/** 验证真实打包后的公共入口直接消费 Key 对象，无需预注册名称。 */
/// <reference types="node" />
import { execFileSync } from 'node:child_process'
import { expect, test } from 'vitest'

test('打包后的公共入口直接使用 Key 与 Variable 声明', () => {
  const probe = `
    const result = await Bun.build({ entrypoints: ['./src/style-system/index.ts'], target: 'browser', write: false, minify: false })
    if (!result.success) throw new Error(result.logs.map((log) => log.message).join('\\n'))
    const source = await result.outputs[0].text()
    const moduleURL = 'data:text/javascript;base64,' + Buffer.from(source).toString('base64')
    const styleSystem = await import(moduleURL)
    const surface = styleSystem.variable('black', { name: 'bundle-surface' })
    const opacity = styleSystem.variable(1, { name: 'bundle-opacity', states: { hover: 0.5 } })
    styleSystem.rules('.Built', [
      [styleSystem.key('align-items'), 'center'], [styleSystem.key('margin-left'), '2px'],
      [styleSystem.key('color'), surface], [styleSystem.key('opacity'), opacity],
      [surface, 'blue'],
    ])
    const count = styleSystem.variable(1, { name: 'bundle-modified-count', modification: {
      apply: (current, change) => styleSystem.createJSSContent(resolve => 'calc(' + resolve(current) + ' + ' + resolve(change) + ')', [current, change]),
    } })
    styleSystem.rules('.Built', [count.declare()])
    styleSystem.rules(['.Built', '&:hover'], [count.modify(3)])
    console.log(styleSystem.compileCSS())
  `
  const output = execFileSync('bun', ['-e', probe], { encoding: 'utf8' })
  expect(output).not.toContain(':where(:root) {\n--bundle-surface:')
  const declarationOrder = [
    'align-items: center;', 'margin-left: 2px;',
    'color: var(--bundle-surface, black);', 'opacity: var(--bundle-opacity, 1);',
    '--bundle-surface: blue;',
  ].map((declaration) => output.indexOf(declaration))
  expect(declarationOrder.every((index) => index >= 0)).toBe(true)
  expect(declarationOrder).toEqual([...declarationOrder].sort((left, right) => left - right))
  // Agent 测试假设：精确包装只检查本轮归零实现，不构成公共选择器格式契约。
  expect(output).toContain('&:where(:where(:hover):where(:not(:disabled, [data-status~="disabled"]))) {\n--bundle-opacity: 0.5;')
  expect(output).toContain('--bundle-surface: blue;')
  expect(output).toContain('calc(var(--bundle-modified-count-modify-1-step-1-input) + 3)')
})
