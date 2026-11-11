import { flush } from 'solid-js'
import { render } from '@solidjs/web'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import '../../../css/all-base.css'
import ExampleDashboard, { exampleEntries } from './ExampleDashboard'
import { cssRoot, accentColorTheme } from '@/style-system'
import { cssTokenName } from '@/style-system/token/css'
import { page } from 'vitest/browser'

const runnerPath = `${window.location.pathname}${window.location.search}${window.location.hash}`
let dispose: (() => void) | undefined
let style: HTMLStyleElement

beforeEach(() => {
  style = document.createElement('style')
  style.id = 'css-root'
  document.head.append(style)
  cssRoot.mount()
})

afterEach(() => {
  dispose?.()
  dispose = undefined
  document.body.replaceChildren()
  style.remove()
  document.documentElement.removeAttribute('data-theme')
  window.history.replaceState(null, '', runnerPath)
})

describe('ExampleDashboard', () => {
  test('主页的列数与类别颜色由系统样式和实例数据共同决定', async () => {
    window.history.replaceState(null, '', '/examples')
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(() => <ExampleDashboard />, host)
    const list = document.querySelector<HTMLElement>('.example-list')!
    const shell = document.querySelector<HTMLElement>('.example-shell')!
    const ribbons = [
      ...document.querySelectorAll<HTMLElement>('.example-link-ribbon'),
    ]
    await page.viewport(1200, 800)
    expect(getComputedStyle(list).gridTemplateColumns.split(' ')).toHaveLength(
      6,
    )
    expect(
      new Set(ribbons.map((ribbon) => getComputedStyle(ribbon).backgroundColor))
        .size,
    ).toBeGreaterThan(1)
    const initialBackground = getComputedStyle(shell).backgroundImage
    const accentName = cssTokenName(accentColorTheme)
    document.documentElement.style.setProperty(accentName, 'red')
    expect(getComputedStyle(shell).backgroundImage).not.toBe(initialBackground)
    document.documentElement.style.removeProperty(accentName)
    await page.viewport(500, 800)
    expect(getComputedStyle(list).gridTemplateColumns.split(' ')).toHaveLength(
      2,
    )
    await page.viewport(1280, 720)
  })

  test('主页不预选详情，选择条目后写入可直达 URL', async () => {
    window.history.replaceState(null, '', '/examples')
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(() => <ExampleDashboard />, host)

    expect(document.querySelector('.example-home h1')?.textContent).toBe(
      'Examples',
    )
    expect(document.querySelectorAll('.example-link')).toHaveLength(
      exampleEntries.length,
    )
    expect(document.querySelectorAll('.example-link h2')).toHaveLength(
      exampleEntries.length,
    )
    expect(document.querySelectorAll('.example-link p')).toHaveLength(
      exampleEntries.length,
    )
    expect(document.querySelectorAll('.example-link-ribbon')).toHaveLength(
      exampleEntries.length,
    )
    expect(
      document.querySelectorAll('.example-link[data-thumbnail]'),
    ).toHaveLength(exampleEntries.length)
    expect(document.querySelectorAll('.example-link-thumbnail')).toHaveLength(
      exampleEntries.length,
    )
    const images = [
      ...document.querySelectorAll<HTMLImageElement>('.example-link-thumbnail'),
    ]
    for (const image of images) {
      image.loading = 'eager'
      await image.decode()
      expect(image.naturalWidth).toBeGreaterThan(0)
    }
    expect(new Set(images.map((image) => image.src)).size).toBe(
      exampleEntries.length,
    )
    const asyncEntry = document.querySelector<HTMLAnchorElement>(
      'a[href="/examples/async-state"]',
    )!
    expect(asyncEntry.querySelector('h2')?.textContent).toBe('异步状态')
    expect(asyncEntry.querySelector('p')?.textContent).toBe(
      '由界面处理请求等待、完成与失败。',
    )

    const thumbnail = document.querySelector<HTMLElement>(
      '.example-link-thumbnail',
    )!
    const copy = document.querySelector<HTMLElement>('.example-link-copy')!
    const ribbons = [
      ...document.querySelectorAll<HTMLElement>('.example-link-ribbon'),
    ]
    expect(getComputedStyle(thumbnail).maskImage).toContain('linear-gradient')
    expect(getComputedStyle(copy).backgroundImage).toBe('none')
    expect(
      new Set(ribbons.map((ribbon) => getComputedStyle(ribbon).backgroundColor))
        .size,
    ).toBe(6)

    expect(document.querySelector('.example-home-head p')).toBeNull()
    expect(document.querySelector('.example-category-nav')).toBeNull()
    expect(document.querySelector('.example-link-action')).toBeNull()
    expect(document.querySelector('.example-detail')).toBeNull()
    expect(document.querySelector('.example-home article')).toBeNull()

    document
      .querySelector<HTMLAnchorElement>('a[href="/examples/card"]')!
      .click()
    flush()

    expect(window.location.pathname).toBe('/examples/card')
    expect(document.querySelector('.example-detail h2')?.textContent).toBe(
      'Card',
    )
    expect(document.querySelectorAll('.example-link')).toHaveLength(0)

    const defaultCard =
      document.querySelector<HTMLElement>('.Card.example-card')!
    const smallCard = document.querySelector<HTMLElement>(
      '.card-example-item[data-size="small"]',
    )!
    const largeCard = document.querySelector<HTMLElement>(
      '.card-example-item[data-size="large"]',
    )!
    const softCard = document.querySelector<HTMLElement>(
      '.card-example-item[data-variant="soft"]',
    )!
    const solidCard = document.querySelector<HTMLElement>(
      '.card-example-item[data-variant="solid"]',
    )!
    expect(['block', 'flow-root']).toContain(
      getComputedStyle(defaultCard).display,
    )
    const firstItem = smallCard.querySelector('strong')!,
      nextItem = smallCard.querySelector('span')!
    expect(
      nextItem.getBoundingClientRect().top -
        firstItem.getBoundingClientRect().bottom,
    ).toBeGreaterThan(0)
    expect(
      Number.parseFloat(getComputedStyle(defaultCard).padding),
    ).toBeGreaterThan(0)
    expect(
      Number.parseFloat(getComputedStyle(largeCard).padding),
    ).toBeGreaterThan(Number.parseFloat(getComputedStyle(smallCard).padding))
    expect(getComputedStyle(softCard).backgroundColor).not.toBe(
      getComputedStyle(solidCard).backgroundColor,
    )
  })

  test('新增组件详情可直达、返回目录，并保留单一主要区域', async () => {
    const host = document.body.appendChild(document.createElement('div'))
    window.history.replaceState(null, '', '/examples/flow')
    dispose = render(() => <ExampleDashboard />, host)
    for (const id of [
      'flow',
      'grid',
      'field',
      'navigation-region',
      'link',
      'page',
      'text-area',
      'select',
      'checkbox',
      'details',
      'message-board',
      'text',
      'heading',
      'label',
      'table',
      'loop',
      'component-marker',
      'component-marker-structure-view-trigger',
    ]) {
      window.history.replaceState(null, '', `/examples/${id}`)
      window.dispatchEvent(new PopStateEvent('popstate'))
      flush()
      expect(
        document.querySelector('.example-detail')?.textContent?.trim().length,
      ).toBeGreaterThan(20)
      expect(document.querySelector('.example-missing')).toBeNull()
      expect(document.querySelectorAll('main, [role="main"]')).toHaveLength(1)
      if (id === 'loop') {
        await expect
          .poll(() => document.querySelector('.Loop')?.textContent)
          .toContain('核对结构')
        await Promise.all(
          document
            .getAnimations()
            .map((animation) => animation.finished.catch(() => {})),
        )
      }
    }
    document.querySelector<HTMLAnchorElement>('.example-back')!.click()
    flush()
    expect(window.location.pathname).toBe('/examples')
    expect(document.querySelectorAll('.example-link')).toHaveLength(
      exampleEntries.length,
    )
  })

  test('语义组件导航只列出 Article', () => {
    window.history.replaceState(null, '', '/examples')
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(() => <ExampleDashboard />, host)
    expect(
      host.querySelector('a[href="/examples/article"] .example-link-ribbon')
        ?.textContent,
    ).toContain('语义组件')
    const semanticLinks = [...host.querySelectorAll('.example-link')].filter(
      (link) =>
        link
          .querySelector('.example-link-ribbon')
          ?.textContent?.startsWith('语义组件'),
    )
    expect(
      semanticLinks.map((link) => link.querySelector('h2')?.textContent),
    ).toEqual(['Article'])
  })

  test('Article 示例由外层 Card 承载，皮肤与正文语义各归自身', () => {
    window.history.replaceState(null, '', '/examples/article')
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(() => <ExampleDashboard />, host)

    const card = document.querySelector<HTMLElement>('.Card.example-card')!
    const article = card.firstElementChild!
    expect(article.tagName).toBe('ARTICLE')
    expect(article.querySelector('h2')?.textContent).toBe('Article')
    expect(article.classList.contains('Card')).toBe(false)
    expect(article.parentElement).toBe(card)
    expect(card.tagName).toBe('DIV')
    const articleStyle = getComputedStyle(article)
    expect(articleStyle.padding).toBe('0px')
    expect(articleStyle.backgroundColor).toBe('rgba(0, 0, 0, 0)')
    expect(articleStyle.borderTopStyle).toBe('none')
    expect(articleStyle.borderRadius).toBe('0px')
    expect(parseFloat(getComputedStyle(card).padding)).toBeGreaterThan(0)
    const articles = document.querySelectorAll('.example-detail article')
    expect(articles).toHaveLength(2)
    expect(article.querySelector('article')).toBeNull()
    const nativeArticle = articles[0]
    expect(nativeArticle.classList.contains('Card')).toBe(false)
    expect(nativeArticle.querySelector('article')).toBeNull()
    expect(nativeArticle.querySelector('h3')?.textContent).toBe(
      '原生 Article 正文',
    )
  })
  test('详情 URL 可以直接打开并跟随浏览历史变化', () => {
    window.history.replaceState(null, '', '/examples/droppable')
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(() => <ExampleDashboard />, host)

    expect(document.querySelector('.example-detail h2')?.textContent).toBe(
      'Droppable',
    )

    window.history.replaceState(null, '', '/examples/drag-and-drop')
    window.dispatchEvent(new PopStateEvent('popstate'))
    flush()

    expect(document.querySelector('.example-detail h2')?.textContent).toBe(
      'Drag and Drop 分组',
    )
  })

  test('Draggable 实际拖动期间 Card 始终不使用 Blur', () => {
    window.history.replaceState(null, '', '/examples/draggable')
    const host = document.body.appendChild(document.createElement('div'))
    dispose = render(() => <ExampleDashboard />, host)

    const shell = document.querySelector<HTMLElement>('.example-shell')!
    const card = document.querySelector<HTMLElement>('.Card.example-card')!
    const source = document.querySelector<HTMLElement>(
      '.drag-drop-example-card',
    )!
    Object.assign(source, {
      setPointerCapture: () => undefined,
      hasPointerCapture: () => true,
      releasePointerCapture: () => undefined,
    })

    const lightBackground = getComputedStyle(card).backgroundColor
    const initialFilter = getComputedStyle(card).backdropFilter
    expect(getComputedStyle(shell).backgroundImage).toContain('radial-gradient')
    expect(getComputedStyle(shell).filter).toBe('none')
    expect(initialFilter).toContain('saturate(1.12)')
    expect(initialFilter).not.toContain('blur(')
    expect(getComputedStyle(card).borderStyle).toBe('solid')
    expect(getComputedStyle(card).boxShadow).not.toBe('none')

    document.documentElement.dataset.theme = 'dark'
    expect(getComputedStyle(card).backgroundColor).not.toBe(lightBackground)

    source.dispatchEvent(pointerEvent('pointerdown', 21, 20, 30))
    flush()
    expect(source.getAttribute('data-interacting')).toBe('true')
    expect(source.classList.contains('top-layer')).toBe(true)
    expect(getComputedStyle(card).backdropFilter).toBe(initialFilter)

    window.dispatchEvent(pointerEvent('pointermove', 21, 52, 74))
    flush()
    expect(getComputedStyle(source).translate).toBe('32px 44px')
    expect(getComputedStyle(card).backdropFilter).toBe(initialFilter)
    expect(getComputedStyle(card).backdropFilter).not.toContain('blur(')

    window.dispatchEvent(pointerEvent('pointerup', 21, 52, 74))
    flush()
    expect(source.hasAttribute('data-interacting')).toBe(false)
    expect(source.classList.contains('top-layer')).toBe(false)
    expect(getComputedStyle(card).backdropFilter).toBe(initialFilter)
  })
})

function pointerEvent(
  type: 'pointerdown' | 'pointermove' | 'pointerup',
  pointerId: number,
  clientX: number,
  clientY: number,
): PointerEvent {
  return new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    isPrimary: true,
    button: 0,
    buttons: type === 'pointerup' ? 0 : 1,
    pointerId,
    clientX,
    clientY,
  })
}
