/**
 * 真实打包的 Style System 消费测试。
 *
 * 验证公开入口、现成 Key 与创建登记在打包后仍可生成样式。
 *
 * 防止模块裁剪使名称、别名或组合协议丢失。生成模块写入临时文件，
 * 避开 Windows 对超长 data URL 的路径限制。
 */
/// <reference types="node" />
import { execFileSync } from 'node:child_process'
import { expect, test } from 'vitest'

test('打包后的公共入口直接使用 Key 与 Token 声明', () => {
  const probe = `
    const result = await Bun.build({ entrypoints: ['./src/style-system/index.ts'], target: 'browser', write: false, minify: false })
    if (!result.success) throw new Error(result.logs.map((log) => log.message).join('\\n'))
    const source = await result.outputs[0].text()
    const modulePath = process.cwd() + '/agents/run/bundle-public-' + crypto.randomUUID() + '.mjs'
    await Bun.write(modulePath, source)
    try {
    const { pathToFileURL } = await import('node:url')
    const styleSystem = await import(pathToFileURL(modulePath).href)
    const surfaceName = 'bundle-surface'
    const line = styleSystem.token(() => surface, 'bundle-line')
    const surface = styleSystem.token('black', { name: surfaceName, address: '.Built' })
    const opacity = styleSystem.token(1, { name: 'bundle-opacity', address: '.Built', state: { hover: 0.5 } })
    styleSystem.rules('.Built', [
      [styleSystem.key('align-items'), 'center'], [styleSystem.key('margin-left'), '2px'],
      [styleSystem.key('color'), surface], [styleSystem.key('border-color'), line], [styleSystem.key('opacity'), opacity],
      [surface, 'blue'],
    ])
    const count = styleSystem.token(1, { name: 'bundle-modified-count', address: '.Built' })
    styleSystem.rules(['.Built', '&:hover'], [styleSystem.modify(count, { type: 'expression', detail: currentExpression => styleSystem.add(currentExpression, 3) })])
    console.log(styleSystem.compileCSS())
    } finally {
      const { unlinkSync } = await import('node:fs')
      unlinkSync(modulePath)
    }
  `
  const output = execFileSync('bun', ['-e', probe], { encoding: 'utf8' })
  expect(output).not.toContain(':where(:root) {\n--bundle-surface:')
  const declarationOrder = [
    'align-items: center;',
    'margin-left: 2px;',
    'color: var(--bundle-surface);',
    'opacity: var(--bundle-opacity);',
    '--bundle-surface: blue;',
  ].map((declaration) => output.indexOf(declaration))
  expect(declarationOrder.every((index) => index >= 0)).toBe(true)
  expect(declarationOrder).toEqual(
    [...declarationOrder].sort((left, right) => left - right),
  )
  expect(output).toContain('--bundle-line: var(--bundle-surface);')
  expect(output).toContain('border-color: var(--bundle-line);')
  expect(output).toContain('--bundle-opacity: 0.5;')
  expect(output).toContain('--bundle-surface: blue;')
  expect(output).toMatch(/calc\(var\(--[^)]+\) \+ 3\)/)
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
    const modulePath = process.cwd() + '/agents/run/bundle-keys-' + crypto.randomUUID() + '.mjs'
    await Bun.write(modulePath, source)
    try {
    const { pathToFileURL } = await import('node:url')
    const styleSystem = await import(pathToFileURL(modulePath).href)
    const { $boxShadow, resolveJSSKey } = styleSystem
    if (resolveJSSKey('box-shadow') !== $boxShadow || resolveJSSKey('boxShadow') !== $boxShadow)
      throw new Error('现成 Key 的名称与别名没有解析到原定义。')
    styleSystem.rules('.BundledMaterial', [[$boxShadow, '1px 2px red'], ['box-shadow', '3px 4px blue'], ['boxShadow', '5px 6px green']])
    const spacing = styleSystem.key('bundle-combined-spacing', { join: items => styleSystem.token({ default: items }, { toCSSString: (items, resolve) => items.map(resolve).filter(item => item !== undefined).join(' ') }) })
    if (resolveJSSKey(spacing.name) !== spacing || resolveJSSKey('bundleCombinedSpacing') !== spacing)
      throw new Error('新建 Key 的名称与别名没有解析到原定义。')
    styleSystem.rules('.BundledCustomJoin', [[spacing, '2px'], [spacing.name, '3px'], ['bundleCombinedSpacing', '4px']])
    console.log(styleSystem.compileCSS())
    } finally {
      const { unlinkSync } = await import('node:fs')
      unlinkSync(modulePath)
    }
  `
  const output = execFileSync('bun', ['-e', probe], { encoding: 'utf8' })
  expect(output).toContain(
    'box-shadow: 1px 2px red, 3px 4px blue, 5px 6px green;',
  )
  expect(output.match(/box-shadow:/g)).toHaveLength(1)
  expect(output).toContain('bundle-combined-spacing: 2px 3px 4px;')
  expect(output.match(/bundle-combined-spacing:/g)).toHaveLength(1)
})

test('发布包根与样式子路径独立消费，区分点击插件与样式', () => {
  const probe = `
    const { JSDOM } = await import('jsdom')
    const { window } = new JSDOM('<!doctype html><style id="css-root"></style>')
    Object.assign(globalThis, { window, document: window.document })
    const styles = await import('@edsolater/uikit/style-system')
    const passiveImport = styles.compileCSS() === '' && document.querySelector('style').textContent === ''
    const uikit = await import('@edsolater/uikit')
    const sharedRegistry = styles.compileCSS().includes('.Button')
    const host = document.createElement('div')
    const unmount = uikit.render(() => uikit.Show({ when: true, children: () => uikit.For({ each: ['published'], children: text => document.createTextNode(text) }) }), host)
    const rendered = host.textContent === 'published'
    unmount()
    const handle = styles.rules('.PublishedProbe', [[styles.key('width'), '17px']])
    styles.cssRoot.mount()
    const mounted = document.querySelector('style').textContent.includes('width: 17px;')
    handle.remove()
    styles.cssRoot.mount()
    console.log(JSON.stringify({
      mounted,
      rendered,
      passiveImport,
      sharedRegistry,
      separate: !('rules' in uikit) && !('cssRoot' in uikit),
      removed: !styles.compileCSS().includes('.PublishedProbe'),
      distinctClickable: typeof uikit.clickable === 'function' && typeof styles.clickable === 'function' && uikit.clickable !== styles.clickable,
    }))
  `
  const output = execFileSync('bun', ['--conditions=browser', '-e', probe], {
    encoding: 'utf8',
  })
  expect(JSON.parse(output)).toEqual({
    mounted: true,
    rendered: true,
    passiveImport: true,
    sharedRegistry: true,
    separate: true,
    removed: true,
    distinctClickable: true,
  })
})

/**
 * 本用例选择空格序列输出，空项不占位置。
 */
const arraySequenceToCSSString = (items, resolve) =>
  items
    .map(resolve)
    .filter((item) => item !== undefined)
    .join(' ')
