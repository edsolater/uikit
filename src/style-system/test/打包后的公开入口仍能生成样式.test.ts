/** 真实打包的 Style System 消费测试。
 *
 * 验证公开入口、现成 Key 与创建登记在打包后仍可生成样式。
 *
 * 防止模块裁剪使名称、别名或组合协议丢失。
 */
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

test('直接打包消费现成 Key，名称和别名保留同一定义及默认或显式组合', () => {
  const probe = `
    const result = await Bun.build({ entrypoints: ['bundle-key-probe'], target: 'browser', write: false, minify: true,
      plugins: [{ name: '内存测试入口', setup(build) {
        build.onResolve({ filter: /^bundle-key-probe$/ }, () => ({ path: 'bundle-key-probe', namespace: 'probe' }))
        build.onLoad({ filter: /.*/, namespace: 'probe' }, () => ({
          contents: "export * from './src/style-system/index.ts'; export { $boxShadow } from './src/style-system/pieces/keys/box-shadow.ts'",
          loader: 'ts', resolveDir: process.cwd(),
        }))
      } }],
    })
    if (!result.success) throw new Error(result.logs.map((log) => log.message).join('\\n'))
    const source = await result.outputs[0].text()
    const styleSystem = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'))
    const { $boxShadow, resolveJSSKey } = styleSystem
    if (resolveJSSKey('box-shadow') !== $boxShadow || resolveJSSKey('boxShadow') !== $boxShadow)
      throw new Error('现成 Key 的名称与别名没有解析到原定义。')
    styleSystem.rules('.BundledMaterial', [[$boxShadow, '1px 2px red'], ['box-shadow', '3px 4px blue'], ['boxShadow', '5px 6px green']])
    const spacing = styleSystem.key('bundle-combined-spacing', { join: items => styleSystem.value(items, { toCSSString: styleSystem.arraySequenceToCSSString }) })
    if (resolveJSSKey(spacing.name) !== spacing || resolveJSSKey('bundleCombinedSpacing') !== spacing)
      throw new Error('新建 Key 的名称与别名没有解析到原定义。')
    styleSystem.rules('.BundledCustomJoin', [[spacing, '2px'], [spacing.name, '3px'], ['bundleCombinedSpacing', '4px']])
    console.log(styleSystem.compileCSS())
  `
  const output = execFileSync('bun', ['-e', probe], { encoding: 'utf8' })
  expect(output).toContain('box-shadow: 1px 2px red, 3px 4px blue, 5px 6px green;')
  expect(output.match(/box-shadow:/g)).toHaveLength(1)
  expect(output).toContain('bundle-combined-spacing: 2px 3px 4px;')
  expect(output.match(/bundle-combined-spacing:/g)).toHaveLength(1)
})
