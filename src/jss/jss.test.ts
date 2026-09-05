// @vitest-environment jsdom

/** 验证 JSS 结果从离线组合、生命周期连接到真实挂载的完整边界。 */
import { afterEach, describe, expect, test, vi } from 'vitest'
import {
  atRule,
  createCssBlock,
  cssAtom,
  cssColorMix,
  cssDeclaration,
  cssValue,
  cssValueSequence,
  cssVariable,
  mountCssStylesheet,
  parseCssStylesheet,
  registerCssAtoms,
  selector,
  stylesheet,
  withCssValueActivation,
} from '.'

afterEach(() => {
  document.head.replaceChildren()
})

describe('JSS', () => {
  test('value 组合保留动态结果，直到最终 parse 才读取', () => {
    const readColor = vi.fn(() => 'rgb(10 20 30)')
    const color = cssValue(readColor)
    const composed = cssValueSequence('color-mix(in oklab, ', color, ', white)')
    const root = stylesheet(selector('.lazy', cssDeclaration('color', composed)))
    const activate = vi.fn()

    withCssValueActivation(color, activate)

    expect(readColor).not.toHaveBeenCalled()
    expect(activate).not.toHaveBeenCalled()
    expect(parseCssStylesheet(root)).toContain('color: color-mix(in oklab, rgb(10 20 30), white);')
    expect(readColor).toHaveBeenCalledTimes(1)
    expect(activate).not.toHaveBeenCalled()

    mountCssStylesheet(document, 'lazy', root)
    expect(readColor).toHaveBeenCalledTimes(2)
    expect(activate).toHaveBeenCalledOnce()

    mountCssStylesheet(document, 'lazy', root)
    expect(readColor).toHaveBeenCalledTimes(2)
    expect(activate).toHaveBeenCalledOnce()
  })

  test('attach 只连接离线结果，活根保持 declaration、block 与容器顺序', () => {
    const activationOrder: string[] = []
    const dependency = withCssValueActivation(cssValue('rgb(10 20 30)'), () =>
      activationOrder.push('dependency'),
    )
    const composedValue = withCssValueActivation(
      cssValueSequence('color-mix(in oklab, ', dependency, ', white)'),
      () => activationOrder.push('value'),
    )
    const reusable = createCssBlock().attach(
      cssDeclaration('display', 'block'),
      cssDeclaration('color', composedValue),
    )
    const root = stylesheet().attach(
      selector('.first').attach(
        cssDeclaration('order', 1),
        reusable,
        selector('&:hover', cssDeclaration('opacity', 0.8)),
        cssDeclaration('order', 2),
      ),
      atRule('@media (width > 10px)', selector('.second', reusable)),
    )

    expect(document.head.querySelector('style')).toBeNull()
    expect(activationOrder).toEqual([])

    const style = mountCssStylesheet(document, 'jss-order', root)
    const cssText = style.textContent!

    expect(activationOrder).toEqual(['dependency', 'value'])
    expect(cssText.indexOf('order: 1;')).toBeLessThan(cssText.indexOf('display: block;'))
    expect(cssText.indexOf('display: block;')).toBeLessThan(cssText.indexOf('&:hover'))
    expect(cssText.indexOf('&:hover')).toBeLessThan(cssText.indexOf('order: 2;'))
    expect(cssText.indexOf('.first')).toBeLessThan(cssText.indexOf('@media (width > 10px)'))
    expect(mountCssStylesheet(document, 'jss-order', root)).toBe(style)
    expect(activationOrder).toEqual(['dependency', 'value'])
  })

  test('declaration 把 value 激活生命周期沿 attach 链传到所属 Document', () => {
    const activate = vi.fn()
    const trackedValue = withCssValueActivation(cssValue('tomato'), ({ document }) => activate(document))
    const block = createCssBlock().attach(cssDeclaration('color', trackedValue, [trackedValue]))
    const root = stylesheet(selector('.tracked', block))
    const anotherDocument = document.implementation.createHTMLDocument('another')

    expect(activate).not.toHaveBeenCalled()
    mountCssStylesheet(document, 'tracked-main', root)
    mountCssStylesheet(document, 'tracked-main-again', root)
    mountCssStylesheet(anotherDocument, 'tracked-another', root)

    expect(activate).toHaveBeenCalledTimes(2)
    expect(activate).toHaveBeenNthCalledWith(1, document)
    expect(activate).toHaveBeenNthCalledWith(2, anotherDocument)
  })

  test('cssVariable 被直接消费后注册自己拥有的全局默认与状态规则', () => {
    const smartColor = cssVariable('smart-color', {
      property: { syntax: '<color>', inherits: true, initialValue: 'blue' },
      value: { default: 'blue', hover: 'green', active: 'red', focusVisible: 'orange' },
    })
    const block = createCssBlock().attach(cssAtom.color(smartColor))
    const root = stylesheet(selector('.smart', block))

    expect(document.head.querySelector('style[data-uikit-css-variables]')).toBeNull()

    const style = mountCssStylesheet(document, 'smart-variable', root)
    const registration = document.head.querySelector('style[data-uikit-css-variables]')?.textContent

    expect(style.textContent).toContain('color: var(--smart-color);')
    expect(style.textContent).not.toContain('--smart-color: blue;')
    expect(style.textContent).not.toContain(':where(')
    expect(registration).toContain('@property --smart-color')
    expect(registration).toContain('syntax: "<color>";')
    expect(registration).not.toContain(':where(:root) {\n  --smart-color: blue;\n}')
    expect(registration).not.toContain(':where(*)')
    expect(registration).toContain(':where(:hover) {\n  --smart-color: green;\n}')
    expect(registration).toContain(':where(:active) {\n  --smart-color: red;\n}')
    expect(registration).toContain(':where(:focus-visible) {\n  --smart-color: orange;\n}')
    expect(registration?.match(/@property --smart-color/g)).toHaveLength(1)

    mountCssStylesheet(document, 'smart-variable-again', root)
    expect(registration?.match(/@property --smart-color/g)).toHaveLength(1)
  })

  test('declaration 表达局部覆盖，但不会改变变量全局配方的 selector', () => {
    const color = cssVariable('layered-color', {
      value: { default: 'blue', hover: 'green' },
    })
    const root = stylesheet(selector('.local', color.declaration('rebeccapurple'), cssAtom.color(color)))

    const style = mountCssStylesheet(document, 'local-override', root)
    const registration = document.head.querySelector('style[data-uikit-css-variables]')?.textContent

    expect(style.textContent).toContain('.local {\n  --layered-color: rebeccapurple;')
    expect(style.textContent).not.toContain(':where(:hover)')
    expect(registration).toContain(':where(:hover) {\n  --layered-color: green;\n}')
    expect(registration).toContain(':where(:root) {\n  --layered-color: blue;\n}')
    expect(registration).not.toContain(':where(*)')
    expect(registration).not.toContain('.local')
  })

  test('同名变量的相同配方保持幂等，不同配方暴露冲突且保留原注册', () => {
    const first = cssVariable('registration-contract', { value: 'blue' })
    const equivalent = cssVariable('registration-contract', { value: 'blue' })
    const conflicting = cssVariable('registration-contract', { value: 'red' })

    mountCssStylesheet(document, 'registration-first', stylesheet(selector('.first', cssAtom.color(first))))
    mountCssStylesheet(
      document,
      'registration-equivalent',
      stylesheet(selector('.equivalent', cssAtom.color(equivalent))),
    )
    const registeredStyle = document.head.querySelector<HTMLStyleElement>('style[data-uikit-css-variables]')

    expect(registeredStyle?.textContent?.match(/--registration-contract: blue;/g)).toHaveLength(1)
    expect(() =>
      mountCssStylesheet(
        document,
        'registration-conflicting',
        stylesheet(selector('.conflicting', cssAtom.color(conflicting))),
      ),
    ).toThrow('CssVariable “--registration-contract”在同一 Document 中存在冲突的注册。')
    expect(registeredStyle?.textContent).toContain('--registration-contract: blue;')
    expect(registeredStyle?.textContent).not.toContain('--registration-contract: red;')
  })

  test('智能变量派生保持对象依赖，直到激活注册时才读取状态内容', () => {
    const readSurface = vi.fn(() => 'oklch(94% 0.01 260)')
    const surface = cssVariable('derived-surface', {
      value: { default: cssValue(readSurface), hover: 'oklch(88% 0.02 260)' },
    })
    const background = cssVariable('derived-background', {
      value: {
        default: cssColorMix([surface, 0.8], 'white'),
        hover: cssColorMix([surface, 0.7], 'white'),
      },
    })
    const root = stylesheet(selector('.derived', cssAtom.backgroundColor(background)))

    expect(parseCssStylesheet(root)).toContain('background-color: var(--derived-background);')
    expect(readSurface).not.toHaveBeenCalled()
    expect(document.head.querySelector('style[data-uikit-css-variables]')).toBeNull()

    mountCssStylesheet(document, 'derived-variable', root)
    const registration = document.head.querySelector('style[data-uikit-css-variables]')?.textContent ?? ''

    expect(readSurface).toHaveBeenCalledOnce()
    expect(registration.indexOf(':where(:root) {\n  --derived-surface:')).toBeLessThan(
      registration.indexOf(':where(:root) {\n  --derived-background:'),
    )
    expect(registration).toContain('--derived-background: color-mix(in oklab, var(--derived-surface) 80%, white);')
  })

  test('最终解析发现动态和外部 value 返回的变量后仍会激活其配方', () => {
    const dynamicVariable = cssVariable('dynamic-nested', { value: 'blue' })
    const externalVariable = cssVariable('external-nested', { value: 'green' })
    const readDynamic = vi.fn(() => dynamicVariable)
    const readExternal = vi.fn(() => externalVariable)
    const dynamicValue = cssValue(readDynamic)
    const externalValue = { cssString: readExternal }
    const root = stylesheet(
      selector('.nested-values', cssDeclaration('color', dynamicValue), cssDeclaration('border-color', externalValue)),
    )

    mountCssStylesheet(document, 'nested-values', root)
    const registration = document.head.querySelector('style[data-uikit-css-variables]')?.textContent ?? ''

    expect(readDynamic).toHaveBeenCalledOnce()
    expect(readExternal).toHaveBeenCalledOnce()
    expect(registration).toContain('--dynamic-nested: blue;')
    expect(registration).toContain('--external-nested: green;')
  })

  test('活 Box 后续 attach 会激活新依赖并刷新已挂载 stylesheet', () => {
    const activate = vi.fn()
    const liveSelector = selector('.live', cssDeclaration('display', 'block'))
    const root = stylesheet(liveSelector)
    const style = mountCssStylesheet(document, 'live-append', root)
    const lateValue = withCssValueActivation(cssValue('0.5'), activate)

    expect(style.textContent).not.toContain('opacity')
    liveSelector.attach(cssDeclaration('opacity', lateValue))

    expect(activate).toHaveBeenCalledOnce()
    expect(style.textContent).toContain('opacity: 0.5;')
  })

  test('激活行为向正在激活的 Box 追加内容时由同一传播过程接管', () => {
    const liveSelector = selector('.activation-append')
    const value = withCssValueActivation(cssValue('tomato'), () => {
      liveSelector.attach(cssDeclaration('opacity', 0.5))
    })
    liveSelector.attach(cssDeclaration('color', value))

    const style = mountCssStylesheet(document, 'activation-append', stylesheet(liveSelector))

    expect(style.textContent).toContain('color: tomato;')
    expect(style.textContent).toContain('opacity: 0.5;')
  })

  test('最终解析发现的激活行为追加内容后不会用旧解析结果覆盖新结果', () => {
    const liveSelector = selector('.materialization-append')
    const hiddenValue = withCssValueActivation(cssValue('tomato'), () => {
      liveSelector.attach(cssDeclaration('opacity', 0.5))
    })
    liveSelector.attach(cssDeclaration('color', cssValue(() => hiddenValue)))

    const style = mountCssStylesheet(document, 'materialization-append', stylesheet(liveSelector))

    expect(style.textContent).toContain('color: tomato;')
    expect(style.textContent).toContain('opacity: 0.5;')
  })

  test('共享 Box 向多个父级和 Document 传播一次激活并刷新全部 stylesheet', () => {
    const documents: Document[] = []
    const shared = createCssBlock(cssDeclaration('display', 'block'))
    const firstRoot = stylesheet(selector('.first-shared', shared))
    const secondRoot = stylesheet(selector('.second-shared', shared))
    const anotherDocument = document.implementation.createHTMLDocument('shared')
    const firstStyle = mountCssStylesheet(document, 'shared-first', firstRoot)
    const secondStyle = mountCssStylesheet(document, 'shared-second', secondRoot)
    const anotherStyle = mountCssStylesheet(anotherDocument, 'shared-another', firstRoot)
    const lateValue = withCssValueActivation(cssValue('tomato'), ({ document }) => documents.push(document))

    shared.attach(cssDeclaration('color', lateValue))

    expect(documents).toEqual([document, anotherDocument])
    expect(firstStyle.textContent).toContain('color: tomato;')
    expect(secondStyle.textContent).toContain('color: tomato;')
    expect(anotherStyle.textContent).toContain('color: tomato;')
  })

  test('失败的 value 激活保留为未完成并允许下一次 mount 重试', () => {
    const activate = vi.fn(() => {
      if (activate.mock.calls.length === 1) throw new Error('first activation failed')
    })
    const value = withCssValueActivation(cssValue('tomato'), activate)
    const readDynamic = vi.fn(() => value)
    const root = stylesheet(selector('.retry', cssDeclaration('color', cssValue(readDynamic))))

    expect(() => mountCssStylesheet(document, 'retry', root)).toThrow('first activation failed')
    expect(document.head.querySelector('style[data-uikit-css="retry"]')).toBeNull()

    const style = mountCssStylesheet(document, 'retry', root)
    expect(activate).toHaveBeenCalledTimes(2)
    expect(readDynamic).toHaveBeenCalledOnce()
    expect(style.textContent).toContain('color: tomato;')
  })

  test('最终物化读取失败后保持待刷新状态并恢复同身份的 root 替换', () => {
    const firstRoot = stylesheet(selector('.first-root', cssDeclaration('display', 'block')))
    const style = mountCssStylesheet(document, 'replace-root', firstRoot)
    const readDynamic = vi.fn(() => {
      if (readDynamic.mock.calls.length === 1) throw new Error('first materialization failed')
      return 'tomato'
    })
    const nextRoot = stylesheet(selector('.next-root', cssDeclaration('color', cssValue(readDynamic))))

    expect(() => mountCssStylesheet(document, 'replace-root', nextRoot)).toThrow('first materialization failed')
    expect(style.textContent).toContain('.first-root')

    expect(mountCssStylesheet(document, 'replace-root', nextRoot)).toBe(style)
    expect(readDynamic).toHaveBeenCalledTimes(2)
    expect(style.textContent).toContain('.next-root {\n  color: tomato;')
    expect(style.textContent).not.toContain('.first-root')
  })

  test('cssAtom 只保存函数，同名注册使用最后一个工厂', () => {
    const firstView = registerCssAtoms({
      /** 取得第一次注册的隐藏 atom。 */
      jssRegistryTest: () => createCssBlock(cssDeclaration('display', 'none')),
    })
    const firstFactory = firstView.jssRegistryTest
    const secondView = registerCssAtoms({
      /** 取得覆盖注册的显示 atom。 */
      jssRegistryTest: () => createCssBlock(cssDeclaration('display', 'block')),
    })
    const secondFactory = secondView.jssRegistryTest
    const block = cssAtom.jssRegistryTest()

    expect(typeof cssAtom.jssRegistryTest).toBe('function')
    expect(cssAtom.jssRegistryTest).not.toBe(firstFactory)
    expect(cssAtom.jssRegistryTest).toBe(secondFactory)
    expect(Object.keys(block)).toEqual(['attach'])
    expect(parseCssStylesheet(stylesheet(selector('.registry', block)))).toContain('display: block;')
  })

  test('selector 可以直接融合多个通用 atoms', () => {
    const root = stylesheet(
      selector(
        '.disabled',
        cssAtom.boxShadow('none'),
        cssAtom.cursor('not-allowed'),
        cssAtom.opacity(0.48),
        cssAtom.transform('none'),
      ),
    )

    expect(parseCssStylesheet(root)).toContain(
      '.disabled {\n  box-shadow: none;\n  cursor: not-allowed;\n  opacity: 0.48;\n  transform: none;\n}',
    )
  })

  test('stylesheet 根拒绝直接挂载 declaration block', () => {
    const invalidRoot = stylesheet(createCssBlock(cssDeclaration('display', 'none')))

    expect(() => parseCssStylesheet(invalidRoot)).toThrow(
      'CssKey “display”不能直接挂载到 stylesheet 根。',
    )
  })

  test('离线 parser 拒绝循环 Box，但允许共享 Box 在不同路径重复展开', () => {
    const cyclic = selector('.cyclic')
    cyclic.attach(cyclic)
    expect(() => parseCssStylesheet(stylesheet(cyclic))).toThrow('CssBox 挂载关系形成了循环。')

    const shared = selector('.shared', cssDeclaration('display', 'block'))
    const cssText = parseCssStylesheet(stylesheet(atRule('@layer first', shared), atRule('@layer second', shared)))
    expect(cssText.match(/\.shared/g)).toHaveLength(2)
  })
})
