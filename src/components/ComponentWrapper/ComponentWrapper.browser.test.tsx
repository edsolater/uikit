/**
 * 结构查看的真实浏览器验收。
 *
 * 从公开组件与手动FAB验证用途、真实边界和原界面保持。
 *
 * 覆盖原生表格、选项、同根组合、多根文本、动态节点与顶层浮层。
 */
import { render } from '@solidjs/web'
import { flush } from 'solid-js'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { cssRoot } from '@/style-system'
import { createState, Loading, Show } from '@/foundation'
import { Article, Button, Card, ComponentWrapper, Each, Input, Piv, Popover, StructureViewFab, Table } from '@/components'
import '@/css/all-base.css'

let dispose: (() => void) | undefined
let styleHost: HTMLStyleElement

beforeEach(() => {
  styleHost = document.head.appendChild(document.createElement('style'))
  styleHost.id = 'css-root'
  cssRoot.mount()
})

afterEach(() => {
  dispose?.()
  dispose = undefined
  styleHost.remove()
  document.body.replaceChildren()
})

/**
 * 创建具有真实尺寸的应用挂载点，避免用固定假边界替代浏览器布局。
 */
function createHost() {
  const host = document.body.appendChild(document.createElement('main'))
  host.style.cssText = 'padding:32px;width:700px;max-width:90vw;'
  return host
}

/**
 * 点击应用手动加载的浮动开关。
 */
function toggleView() {
  document.querySelector<HTMLButtonElement>('.StructureViewFab')!.click()
  flush()
}

/**
 * 读取使用者实际看见的组件标注。
 */
function readLabels() {
  return [...document.querySelectorAll('.StructureViewOverlay .label')].map(element => element.textContent)
}

describe('组件结构查看', () => {
  test('false隐藏实际多根及浮层并压住子框，裸文本不改节点且样式来源继续更新', async () => {
    const display = createState(false)
    const opacity = createState(0.8)
    const content = createState('TRUE')
    const host = createHost()
    dispose = render(() => <>
      <ComponentWrapper componentName="透明父" descriptionDisplay={display.read()}>
        <Piv style={{ opacity }}>
          <Button descriptionDisplay>子动作</Button>
          <Popover trigger="原生浮层"><Piv>浮层内容</Piv></Popover>
        </Piv>
        <ComponentWrapper componentName="裸子" descriptionDisplay>{content.read()}</ComponentWrapper>
        <Piv as="table"><Piv as="tbody"><Piv as="tr"><Piv as="td">原单元格</Piv></Piv></Piv></Piv>
        <Piv as="select"><Piv as="option">原选项</Piv></Piv>
      </ComponentWrapper>
      <ComponentWrapper componentName="视口外父" descriptionDisplay={false}>
        <Piv style={{ position: 'fixed', top: '-1000px', height: '0px' }}>
          <Button style={{ position: 'fixed', top: '8px', left: '8px' }}>固定子动作</Button>
        </Piv>
      </ComponentWrapper>
      <Button>外部动作</Button>
      <StructureViewFab />
    </>, host)
    const root = host.firstElementChild as HTMLElement
    const originalNodes = [...host.childNodes]
    const originalBounds = root.getBoundingClientRect().toJSON()
    const popover = root.querySelector<HTMLElement>('[popover]')!
    expect(getComputedStyle(root).opacity).toBe('0.8')
    toggleView()
    await expect.poll(() => getComputedStyle(root).opacity).toBe('0')
    await expect.poll(readLabels).toEqual(['Button · 执行动作'])
    expect(root.getBoundingClientRect().toJSON()).toEqual(originalBounds)
    expect([...host.childNodes].filter(node => !(node instanceof Element && node.matches('.StructureViewOverlay')))).toEqual(originalNodes)
    expect(host.querySelector('table > tbody > tr > td')?.textContent).toBe('原单元格')
    expect(host.querySelector('select > option')?.textContent).toBe('原选项')
    const highlight = CSS.highlights.get('uikit-structure-view-hidden')!
    expect([...highlight].some(range => range.toString() === 'TRUE')).toBe(true)
    expect(getComputedStyle(host, '::highlight(uikit-structure-view-hidden)').color).toBe('rgba(0, 0, 0, 0)')
    expect(popover.matches(':popover-open')).toBe(false)
    root.querySelector<HTMLButtonElement>('.Popover > .trigger')!.click()
    await expect.poll(() => popover.matches(':popover-open')).toBe(true)
    await expect.poll(() => getComputedStyle(popover).opacity).toBe('0')
    opacity.set(0.35)
    content.set('FALSE')
    flush()
    await expect.poll(() => [...highlight].some(range => range.toString() === 'FALSE')).toBe(true)
    expect(root.style.opacity).toBe('0.35')
    display.set(true)
    flush()
    await expect.poll(() => getComputedStyle(root).opacity).toBe('0.35')
    await expect.poll(readLabels).toContain('裸子')
    await expect.poll(() => getComputedStyle(popover).opacity).toBe('1')
    display.set(false)
    flush()
    await expect.poll(() => getComputedStyle(root).opacity).toBe('0')
    toggleView()
    expect(root.style.opacity).toBe('0.35')
    await expect.poll(() => getComputedStyle(root).opacity).toBe('0.35')
    expect(host.querySelector('[data-structure-view-hidden]')).toBeNull()
    expect(CSS.highlights.has('uikit-structure-view-hidden')).toBe(false)
  })

  test('未加载和加载未开启都保持内容，开启后外部说明覆盖默认且能响应更新', async () => {
    const description = createState<string | undefined>()
    const showFab = createState(false)
    const host = createHost()
    dispose = render(() => <>
      <Button description={description}>确认</Button>
      <Show when={showFab.read()}><StructureViewFab /></Show>
    </>, host)
    const button = host.querySelector('button')!
    const before = button.getBoundingClientRect().toJSON()
    expect(document.querySelector('.StructureViewFab')).toBeNull()
    expect(document.querySelector('.StructureViewOverlay')).toBeNull()
    showFab.set(true)
    flush()
    expect(document.querySelector('.StructureViewFab')?.getAttribute('aria-pressed')).toBe('false')
    expect(document.querySelector('.StructureViewOverlay')).toBeNull()
    expect(button.getBoundingClientRect().toJSON()).toEqual(before)

    toggleView()
    await expect.poll(readLabels).toContain('Button · 执行动作')
    const overlay = document.querySelector<HTMLElement>('.StructureViewOverlay')!
    expect(overlay.querySelector('canvas')!.getBoundingClientRect().height).toBe(overlay.getBoundingClientRect().height)
    description.set('保存当前选择')
    flush()
    await expect.poll(readLabels).toContain('Button · 保存当前选择')
    description.set('')
    flush()
    await expect.poll(readLabels).toContain('Button')
    expect(readLabels()).not.toContain('Button · 执行动作')
    description.set(undefined)
    flush()
    await expect.poll(readLabels).toContain('Button · 执行动作')
    expect(button.getBoundingClientRect().toJSON()).toEqual(before)
    toggleView()
    expect(document.querySelector('.StructureViewOverlay')).toBeNull()
    expect(host.querySelector('button')).toBe(button)
  })

  test('所有现役组件显示真实身份，同根组合及原生结构不增加元素并保持交互状态', async () => {
    const clicks = vi.fn()
    const host = createHost()
    dispose = render(() => <>
      <Article as={Card}>
        <Button onClick={clicks}>执行</Button>
        <Button disabled>禁止</Button>
        <Input htmlProps={{ value: '保留草稿' }} />
        <Table data={[{ 名称: '记录' }]} />
        <Popover trigger="补充">浮层正文</Popover>
        <Each each={() => ['一项']}>{item => <p>{item}</p>}</Each>
      </Article>
      <StructureViewFab />
    </>, host)
    const article = host.querySelector('article')!
    const input = host.querySelector('input')!
    const action = article.querySelector('button')!
    const disabled = article.querySelectorAll('button')[1]
    await expect.poll(() => article.querySelectorAll('.Loop > p').length).toBe(1)
    input.focus()
    input.value = '用户继续输入'
    const originalElements = [...article.querySelectorAll('*')]
    const before = article.getBoundingClientRect().toJSON()
    expect(host.children).toHaveLength(2)
    expect(host.querySelector('table > thead > tr > th')?.textContent).toBe('名称')
    expect(host.querySelector('table > tbody > tr > td')?.textContent).toBe('记录')
    toggleView()
    await expect.poll(readLabels).toEqual(expect.arrayContaining([
      'Article · 承载独立正文', 'Card · 组织独立信息', 'Button · 执行动作',
      'Input · 编辑单行内容', 'Table · 按列展示记录', 'Popover · 显示补充内容', 'Each · 排列重复内容',
    ]))
    expect(readLabels().some(label => label?.startsWith('Piv') || label?.startsWith('ComponentWrapper'))).toBe(false)
    expect([...article.querySelectorAll('*')]).toEqual(originalElements)
    expect(input.value).toBe('用户继续输入')
    expect(article.getBoundingClientRect().toJSON()).toEqual(before)
    action.click()
    disabled.click()
    expect(clicks).toHaveBeenCalledOnce()
    const labelStyle = getComputedStyle(document.querySelector('.StructureViewOverlay .label')!)
    expect(labelStyle.borderTopWidth).toBe('0px')
    expect(labelStyle.backgroundColor).toBe('rgba(0, 0, 0, 0)')
    expect(getComputedStyle(document.querySelector('.StructureViewOverlay')!).pointerEvents).toBe('none')
    toggleView()
    expect(input.value).toBe('用户继续输入')
    expect(host.querySelector('article')).toBe(article)
    expect([...article.querySelectorAll('*')]).toEqual(originalElements)
  })

  test('文本多根、动态分支与option保留原节点关系，退出的组件不残留标注', async () => {
    const visible = createState(true)
    const host = createHost()
    dispose = render(() => <>
      <ComponentWrapper componentName="多根" description="文本和兄弟节点">
        文本根<span>元素根</span><Show when={visible.read()}><Button>动态动作</Button></Show>
      </ComponentWrapper>
      <select><ComponentWrapper componentName="选项组"><option>甲</option><option>乙</option></ComponentWrapper></select>
      <StructureViewFab />
    </>, host)
    const select = host.querySelector('select')!
    expect(select.children).toHaveLength(2)
    expect(select.options).toHaveLength(2)
    expect(host.children).toHaveLength(4)
    toggleView()
    await expect.poll(readLabels).toContain('多根 · 文本和兄弟节点')
    await expect.poll(readLabels).toContain('Button · 执行动作')
    visible.set(false)
    flush()
    await expect.poll(() => readLabels().includes('Button · 执行动作')).toBe(false)
    expect(host.querySelector('span')?.textContent).toBe('元素根')
    visible.set(true)
    flush()
    await expect.poll(readLabels).toContain('Button · 执行动作')
    dispose?.()
    dispose = undefined
    expect(document.querySelector('.StructureViewOverlay')).toBeNull()
  })

  test('开启期间原生Popover仍可开关，覆盖层在新开的顶层surface上可见', async () => {
    const host = createHost()
    dispose = render(() => <>
      <Popover trigger="打开补充" description="原生浮层">真实浮层内容</Popover>
      <StructureViewFab />
    </>, host)
    toggleView()
    const trigger = host.querySelector<HTMLButtonElement>('.Popover > .trigger')!
    trigger.click()
    const popover = host.querySelector<HTMLElement>('[popover]')!
    await expect.poll(() => popover.matches(':popover-open')).toBe(true)
    await expect.poll(readLabels).toContain('Popover · 原生浮层')
    const overlay = document.querySelector<HTMLElement>('.StructureViewOverlay')!
    await expect.poll(() => {
      overlay.style.pointerEvents = 'auto'
      const bounds = popover.getBoundingClientRect()
      const topElement = document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
      overlay.style.removeProperty('pointer-events')
      return topElement === overlay || (topElement !== null && overlay.contains(topElement))
    }).toBe(true)
    trigger.click()
    await expect.poll(() => popover.matches(':popover-open')).toBe(false)
    expect(overlay.matches(':popover-open')).toBe(true)
    toggleView()
    expect(document.querySelector('.StructureViewOverlay')).toBeNull()
  })

  test('异步用途说明由渲染边界接续，完成后仍跟随真实位置', async () => {
    const description = createState<string | undefined>()
    let resolveDescription!: (value: string) => void
    const pendingDescription = new Promise<string>(resolve => { resolveDescription = resolve })
    const host = createHost()
    dispose = render(() => <>
      <Button description={description}>确认</Button>
      <Loading fallback={<p>读取用途说明</p>}><StructureViewFab /></Loading>
    </>, host)
    toggleView()
    await expect.poll(readLabels).toContain('Button · 执行动作')
    description.set(pendingDescription)
    flush()
    resolveDescription('异步提供的用途')
    await expect.poll(readLabels).toContain('Button · 异步提供的用途')
    const before = document.querySelector<HTMLElement>('.StructureViewOverlay > .frame')!.style.top
    host.style.paddingTop = '80px'
    await expect.poll(() => document.querySelector<HTMLElement>('.StructureViewOverlay > .frame')!.style.top).not.toBe(before)
  })

  test('长说明从真实框内部左上角换行，内容在框内裁切且不撑大原框', async () => {
    const host = createHost()
    dispose = render(() => <>
      <ComponentWrapper componentName="用途框" description="很长的说明应当换行并留在原框范围内，不因为标注而改变主体尺寸或把文字放到框外">
        <Piv style={{ width: '96px', height: '42px' }}>真实内容</Piv>
      </ComponentWrapper>
      <StructureViewFab />
    </>, host)
    const content = host.firstElementChild!
    const before = content.getBoundingClientRect()
    toggleView()
    await expect.poll(readLabels).toContain('用途框 · 很长的说明应当换行并留在原框范围内，不因为标注而改变主体尺寸或把文字放到框外')
    const labels = document.querySelector<HTMLElement>('.StructureViewOverlay > .frame > .labels')!
    const label = labels.firstElementChild!
    const bounds = labels.getBoundingClientRect()
    expect(bounds.x).toBe(before.x)
    expect(bounds.y).toBe(before.y)
    expect(bounds.width).toBe(before.width)
    expect(bounds.height).toBeLessThanOrEqual(before.height)
    expect(labels.scrollHeight).toBeGreaterThan(labels.clientHeight)
    expect(getComputedStyle(label).whiteSpace).toBe('normal')
    expect(getComputedStyle(label).overflowWrap).toBe('anywhere')
    expect(getComputedStyle(label).textOverflow).not.toBe('ellipsis')
    expect(getComputedStyle(labels).overflow).toBe('hidden')
    expect(content.getBoundingClientRect().toJSON()).toEqual(before.toJSON())
  })

  test('Canvas按真实CSS尺寸对齐内容，大片父框内的FAB区域保持清晰', async () => {
    const host = createHost()
    dispose = render(() => <>
      <ComponentWrapper componentName="整页内容">
        <Piv style={{ width: '100vw', height: '100vh' }}>真实页面</Piv>
      </ComponentWrapper>
      <StructureViewFab />
    </>, host)
    toggleView()
    await expect.poll(readLabels).toContain('整页内容')
    const canvas = document.querySelector<HTMLCanvasElement>('.StructureViewOverlay > canvas')!
    const bounds = canvas.getBoundingClientRect()
    expect(canvas.width).toBe(Math.round(bounds.width * window.devicePixelRatio))
    expect(canvas.height).toBe(Math.round(bounds.height * window.devicePixelRatio))
    const context = canvas.getContext('2d')!
    const control = document.querySelector<HTMLElement>('.StructureViewFab')!.getBoundingClientRect()
    const controlAlpha = context.getImageData(
      Math.round((control.x + control.width / 2 - bounds.x) * canvas.width / bounds.width),
      Math.round((control.y + control.height / 2 - bounds.y) * canvas.height / bounds.height), 1, 1,
    ).data[3]
    expect(controlAlpha).toBe(0)
    const content = host.firstElementChild!.getBoundingClientRect()
    const contentAlpha = context.getImageData(
      Math.round((content.x + 16 - bounds.x) * canvas.width / bounds.width),
      Math.round((content.y + 40 - bounds.y) * canvas.height / bounds.height), 1, 1,
    ).data[3]
    expect(contentAlpha).toBe(0)
    const frame = document.querySelector<HTMLElement>('.StructureViewOverlay > .frame')!
    const frameBounds = frame.getBoundingClientRect()
    const mask = getComputedStyle(frame, '::before')
    expect(frameBounds.height).toBe(content.height)
    expect(mask.clipPath).toContain('evenodd')
    expect(mask.clipPath).toContain(`${control.left - 2 - frameBounds.left}px`)
    expect(getComputedStyle(frame).clipPath).toBe('none')
    expect(getComputedStyle(canvas).zIndex).toBe('1')
    const controlElement = document.querySelector<HTMLElement>('.StructureViewFab')!
    expect(document.elementFromPoint(control.x + control.width / 2, control.y + control.height / 2)).toBe(controlElement)
    toggleView()
    expect(document.querySelector('.StructureViewOverlay')).toBeNull()
  })

  test('每个真实矩形都有全框伪层，父子同原点按整体层叠且同框标注分行', async () => {
    const host = createHost()
    dispose = render(() => {
      const child = <ComponentWrapper componentName="子框"><Piv style={{ width: '160px', height: '80px' }}>内容</Piv></ComponentWrapper>
      return <>
        <ComponentWrapper componentName="父框">
          <Piv style={{ width: '220px', height: '160px' }}>
            {child}
          </Piv>
        </ComponentWrapper>
        <ComponentWrapper componentName="多根">
          <Piv style={{ width: '100px', height: '30px' }}>第一根</Piv>
          <Piv style={{ width: '80px', height: '40px' }}>第二根</Piv>
        </ComponentWrapper>
        <Article as={Card} style={{ width: '200px', height: '80px' }}>同框内容</Article>
        <StructureViewFab />
      </>
    }, host)
    const original = [...host.querySelectorAll<HTMLElement>('main > div, article')]
    toggleView()
    await expect.poll(readLabels).toContain('子框')
    const frames = [...document.querySelectorAll<HTMLElement>('.StructureViewOverlay > .frame')]
    expect(frames).toHaveLength(5)
    const [parent, child, firstRoot, secondRoot, shared] = frames
    expect(parent.getBoundingClientRect().x).toBe(child.getBoundingClientRect().x)
    expect(parent.getBoundingClientRect().y).toBe(child.getBoundingClientRect().y)
    expect(parent.getBoundingClientRect().height).toBe(160)
    expect(child.getBoundingClientRect().height).toBe(80)
    expect(parent.querySelector('.label')?.textContent).toBe('父框')
    expect(child.querySelector('.label')?.textContent).toBe('子框')
    expect(firstRoot.getBoundingClientRect().height).toBe(30)
    expect(secondRoot.getBoundingClientRect().height).toBe(40)
    expect(firstRoot.querySelectorAll('.label')).toHaveLength(1)
    expect(secondRoot.querySelectorAll('.label')).toHaveLength(0)
    expect(shared.querySelectorAll('.label')).toHaveLength(2)
    for (const frame of frames) {
      const mask = getComputedStyle(frame, '::before')
      expect(getComputedStyle(frame).isolation).toBe('isolate')
      expect(mask.zIndex).toBe('-1')
      expect(mask.backgroundColor).toBe('rgba(255, 255, 255, 0.9)')
      expect(mask.backdropFilter).toBe('blur(4px)')
      expect(mask.width).toBe(getComputedStyle(frame).width)
      expect(mask.height).toBe(getComputedStyle(frame).height)
      expect(getComputedStyle(frame).clipPath).toBe('none')
    }
    expect([...shared.querySelectorAll('.label')].every(label => getComputedStyle(label).display === 'block')).toBe(true)
    toggleView()
    expect(document.querySelector('.StructureViewOverlay')).toBeNull()
    expect(original.every(element => element.isConnected)).toBe(true)
  })
})
