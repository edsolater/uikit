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
    const surface = styleSystem.variable('black', { name: 'bundle-surface', root: { value: 'red' } })
    const opacity = styleSystem.variable(1, { name: 'bundle-opacity', states: { hover: 0.5 } })
    styleSystem.rules('.Built', [
      [styleSystem.key('align-items'), 'center'], [styleSystem.key('margin-left'), '2px'],
      [styleSystem.key('color'), surface], [styleSystem.key('opacity'), opacity],
      [surface, 'blue'],
    ])
    console.log(styleSystem.compileCSS())
  `
  const output = execFileSync('bun', ['-e', probe], { encoding: 'utf8' })
  expect(output).toContain(':where(:root) {\n--bundle-surface: red;')
  expect(output).toContain('align-items: center;\nmargin-left: 2px;\ncolor: var(--bundle-surface, black);\nopacity: var(--bundle-opacity, 1);')
  // Agent 测试假设：精确包装只检查本轮归零实现，不构成公共选择器格式契约。
  expect(output).toContain('&:where(:where(:hover):where(:not(:disabled, [data-status~="disabled"]))) {\n--bundle-opacity: 0.5;')
  expect(output).toContain('--bundle-surface: blue;')
})
