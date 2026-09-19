/** 验证真实打包后的公共入口仍安装完整 CSS Key 名称。 */
/// <reference types="node" />
import { execFileSync } from 'node:child_process'
import { expect, test } from 'vitest'

test('打包后的公共入口保留属性注册，并支持对象 RHS 与 Variable 目标混合声明', () => {
  const probe = `
    const result = await Bun.build({ entrypoints: ['./src/style-system/index.ts'], target: 'browser', write: false, minify: false })
    if (!result.success) throw new Error(result.logs.map((log) => log.message).join('\\n'))
    const source = await result.outputs[0].text()
    const moduleURL = 'data:text/javascript;base64,' + Buffer.from(source).toString('base64')
    const styleSystem = await import(moduleURL)
    const surface = styleSystem.variable('bundle-surface', { root: { value: 'red' }, fallback: 'black' })
    const opacity = styleSystem.value(1, { hover: 0.5 })
    styleSystem.rules('.Built', [
      { alignItems: 'center', marginLeft: '2px', color: surface, opacity },
      [surface, 'blue'],
    ])
    console.log(styleSystem.compileCSS())
  `
  const output = execFileSync('bun', ['-e', probe], { encoding: 'utf8' })
  expect(output).toContain(':where(:root) {\n--bundle-surface: red;')
  expect(output).toContain('.Built {\nalign-items: center;\nmargin-left: 2px;\ncolor: var(--bundle-surface, black);\nopacity: 1;')
  expect(output).toContain('&:where(:hover):where(:not(:disabled, [data-status~="disabled"])) {\nopacity: 0.5;')
  expect(output).toContain('--bundle-surface: blue;')
})
