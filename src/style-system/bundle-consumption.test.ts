/** 验证真实打包后的公共入口仍安装完整 CSS Key 名称。 */
/// <reference types="node" />
import { execFileSync } from 'node:child_process'
import { expect, test } from 'vitest'

test('打包后的公共入口保留未被其他 Mixin 引用的属性名称', () => {
  const probe = `
    const result = await Bun.build({ entrypoints: ['./src/style-system/index.ts'], target: 'browser', write: false, minify: false })
    if (!result.success) throw new Error(result.logs.map((log) => log.message).join('\\n'))
    const source = await result.outputs[0].text()
    const moduleURL = 'data:text/javascript;base64,' + Buffer.from(source).toString('base64')
    const styleSystem = await import(moduleURL)
    styleSystem.rules('.Built', { alignItems: 'center', marginLeft: '2px' })
    console.log(styleSystem.compileCSS())
  `
  const output = execFileSync('bun', ['-e', probe], { encoding: 'utf8' })
  expect(output.trim()).toBe('.Built {\nalign-items: center;\nmargin-left: 2px;\n}')
})
