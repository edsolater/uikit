// @vitest-environment jsdom

/** 验证 JSS 基础对象从离线组合到真实挂载的生命周期。 */
import { describe, expect, test, vi } from 'vitest'
import {
  atRuleBox,
  createCssBlock,
  cssValue,
  cssValueSequence,
  cssBlocks,
  cssVariable,
  mountCssStylesheet,
  parseCssStylesheet,
  registerCssBlocks,
  selectorBox,
  stylesheetBox,
  withCssValueActivation,
} from '.'

describe('style-utils', () => {
  test('value 组合保留动态结果，直到最终 parse 才读取', () => {
    const readColor = vi.fn(() => 'rgb(10 20 30)')
    const color = cssValue(readColor)
    const composed = cssValueSequence('color-mix(in oklab, ', color, ', white)')
    const root = stylesheetBox(selectorBox('.lazy', { color: composed }))
    const activate = vi.fn()

    withCssValueActivation(color, activate)

    expect(readColor).not.toHaveBeenCalled()
    expect(activate).not.toHaveBeenCalled()
    expect(parseCssStylesheet(root, document)).toContain('color: color-mix(in oklab, rgb(10 20 30), white);')
    expect(readColor).toHaveBeenCalledTimes(1)
    expect(activate).toHaveBeenCalledOnce()
  })

  test('离线组合不写 CSS，连接根后保持 box 与 block 的原始顺序', () => {
    const activationOrder: string[] = []
    const dependency = withCssValueActivation(cssValue('rgb(10 20 30)'), () =>
      activationOrder.push('dependency'),
    )
    const composedValue = withCssValueActivation(
      cssValueSequence('color-mix(in oklab, ', dependency, ', white)'),
      () => activationOrder.push('value'),
    )
    const reusable = createCssBlock({ display: 'block', color: composedValue })
    const root = stylesheetBox(
      selectorBox('.first', { order: 1 }, reusable, selectorBox('&:hover', { opacity: 0.8 }), { order: 2 }),
      atRuleBox('@media (width > 10px)', selectorBox('.second', reusable)),
    )
    const identity = 'style-utils-order'

    expect(document.head.querySelector(`style[data-uikit-css="${identity}"]`)).toBeNull()
    expect(activationOrder).toEqual([])

    const style = mountCssStylesheet(document, identity, root)
    const cssText = style.textContent!

    expect(activationOrder).toEqual(['dependency', 'value'])
    expect(cssText.indexOf('order: 1;')).toBeLessThan(cssText.indexOf('display: block;'))
    expect(cssText.indexOf('display: block;')).toBeLessThan(cssText.indexOf('&:hover'))
    expect(cssText.indexOf('&:hover')).toBeLessThan(cssText.indexOf('order: 2;'))
    expect(cssText.indexOf('.first')).toBeLessThan(cssText.indexOf('@media (width > 10px)'))
    expect(mountCssStylesheet(document, identity, root)).toBe(style)
    expect(activationOrder).toEqual(['dependency', 'value'])
  })

  test('同一 value 在不同 Document 中分别激活，普通 value 不制造注册副作用', () => {
    const activate = vi.fn()
    const trackedValue = withCssValueActivation(cssValue('tomato'), ({ document }) => activate(document))
    const block = createCssBlock({ color: trackedValue, display: 'none' })
    const root = stylesheetBox(selectorBox('.tracked', block))
    const anotherDocument = document.implementation.createHTMLDocument('another')

    mountCssStylesheet(document, 'tracked-main', root)
    mountCssStylesheet(document, 'tracked-main-again', root)
    mountCssStylesheet(anotherDocument, 'tracked-another', root)

    expect(activate).toHaveBeenCalledTimes(2)
    expect(activate).toHaveBeenNthCalledWith(1, document)
    expect(activate).toHaveBeenNthCalledWith(2, anotherDocument)
    expect(anotherDocument.head.querySelectorAll('style')).toHaveLength(1)
  })

  test('CssVariable 只在进入活 box 后注册一次 property', () => {
    const progress = cssVariable('progress', {
      fallback: 0,
      property: { syntax: '<number>', inherits: false, initialValue: 0 },
    })
    const root = stylesheetBox(selectorBox('.progress', { opacity: progress, scale: progress }))

    expect(document.head.querySelector('style[data-uikit-css-properties]')).toBeNull()

    const style = mountCssStylesheet(document, 'style-utils-property', root)
    const propertyStyle = document.head.querySelector('style[data-uikit-css-properties]')

    expect(style.textContent).toContain('opacity: var(--progress, 0);')
    expect(propertyStyle?.textContent).toContain('@property --progress')
    expect(propertyStyle?.textContent?.match(/@property --progress/g)).toHaveLength(1)

    mountCssStylesheet(document, 'style-utils-property-again', root)
    expect(propertyStyle?.textContent?.match(/@property --progress/g)).toHaveLength(1)
  })

  test('cssBlocks registry 只保存函数，并允许后注册的同名工厂覆盖', () => {
    const firstView = registerCssBlocks({
      /** 建立第一次注册使用的隐藏 block。 */
      styleUtilsRegistryTest: () => createCssBlock({ display: 'none' }),
    })
    const firstFactory = firstView.styleUtilsRegistryTest
    const secondView = registerCssBlocks({
      /** 建立覆盖注册使用的显示 block。 */
      styleUtilsRegistryTest: () => createCssBlock({ display: 'block' }),
    })
    const secondFactory = secondView.styleUtilsRegistryTest
    const block = cssBlocks.styleUtilsRegistryTest()
    const root = stylesheetBox(selectorBox('.registry', block))

    expect(typeof cssBlocks.styleUtilsRegistryTest).toBe('function')
    expect(cssBlocks.styleUtilsRegistryTest).not.toBe(firstFactory)
    expect(cssBlocks.styleUtilsRegistryTest).toBe(secondFactory)
    expect(Object.keys(block)).toEqual([])
    expect(parseCssStylesheet(root, document)).toContain('display: block;')
  })

  test('一个 selector box 可以直接融合多个通用 declaration blocks', () => {
    const root = stylesheetBox(
      selectorBox(
        '.disabled',
        cssBlocks.boxShadow('none'),
        cssBlocks.cursor('not-allowed'),
        cssBlocks.opacity(0.48),
        cssBlocks.transform('none'),
      ),
    )

    expect(parseCssStylesheet(root, document)).toContain(
      '.disabled {\n  box-shadow: none;\n  cursor: not-allowed;\n  opacity: 0.48;\n  transform: none;\n}',
    )
  })

  test('最终 parse 拒绝把声明 block 直接挂到 stylesheet 根', () => {
    const invalidRoot = stylesheetBox(createCssBlock({ display: 'none' }))

    expect(() => parseCssStylesheet(invalidRoot, document)).toThrow(
      'CssKey “display”不能直接挂载到 StylesheetBox。',
    )
  })
})
