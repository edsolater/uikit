/**
 * 验证成对 Popover 的原生交互与定位。
 *
 * 使用真实 Button 和 Card 检查组合隔离、滚动及外观归属。
 */
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { createState, render, val } from '@/foundation'
import { Button } from '@/components/kits/Button/Button'
import { Card } from '@/components/kits/Card/Card'
import { cssRoot, rules, whenPopoverFlip } from '@/style-system'
import { createDomRef } from '@/hooks/createDomRef'
import { popover } from './popover'
import type { AnchorPosition } from './popover'

let dispose: (() => void) | undefined
beforeEach(() => {
  const style = document.head.appendChild(document.createElement('style'))
  style.id = 'css-root'
  cssRoot.mount()
})
afterEach(() => {
  dispose?.()
  dispose = undefined
  document.body.replaceChildren()
  document.head.querySelector('#css-root')?.remove()
})

test('触发与正文使用实际节点，正文自定义 id 仍可关联', async () => {
  const host = document.body.appendChild(document.createElement('main'))
  let capability!: ReturnType<typeof popover>
  dispose = render(() => {
    capability = popover()
    return <>
      <Button is={capability.popoverTrigger}>打开</Button>
      <Card id="自定义浮层" is={capability.popoverBody}>说明</Card>
    </>
  }, host)
  const trigger = host.querySelector('button')!
  const body = host.querySelector<HTMLElement>('[popover]')!
  await expect.poll(() => trigger.popoverTargetElement).toBe(body)
  expect(body.id).toBe('自定义浮层')
  await expect.poll(() => trigger.getAttribute('aria-expanded')).toBe('false')
  await userEvent.click(trigger)
  await expect.poll(() => body.matches(':popover-open')).toBe(true)
  await expect.poll(() => val(capability.popoverTrigger.controller.isOpen)).toBe(true)
  await expect.poll(() => trigger.getAttribute('aria-expanded')).toBe('true')
  expect(val(capability.popoverBody.controller.isOpen)).toBe(true)
  capability.popoverBody.controller.hidePopover()
  await expect.poll(() => body.matches(':popover-open')).toBe(false)
  await expect.poll(() => trigger.getAttribute('aria-expanded')).toBe('false')
  trigger.focus()
  await userEvent.keyboard('{Enter}')
  await expect.poll(() => body.matches(':popover-open')).toBe(true)
  await userEvent.keyboard('{Enter}')
  await expect.poll(() => body.matches(':popover-open')).toBe(false)
})

test('不同组合不串联，取消打开保持关闭', async () => {
  const host = document.body.appendChild(document.createElement('main'))
  const cancel = vi.fn((open: boolean, event: Event) => { if (open) event.preventDefault() })
  let first!: ReturnType<typeof popover>
  let second!: ReturnType<typeof popover>
  dispose = render(() => {
    first = popover({ popoverBody: { popover: 'manual' } })
    second = popover({ popoverBody: { popover: 'manual', onBeforeToggle: cancel } })
    return <>
      <Button is={first.popoverTrigger}>第一项</Button><Card is={first.popoverBody}>第一正文</Card>
      <Button is={second.popoverTrigger}>第二项</Button><Card is={second.popoverBody}>第二正文</Card>
    </>
  }, host)
  const bodies = host.querySelectorAll<HTMLElement>('[popover]')
  first.popoverTrigger.controller.showPopover()
  await expect.poll(() => bodies[0].matches(':popover-open')).toBe(true)
  second.popoverBody.controller.showPopover()
  await expect.poll(() => cancel).toHaveBeenCalled()
  expect(bodies[1].matches(':popover-open')).toBe(false)
  expect(val(second.popoverBody.controller.isOpen)).toBe(false)
  expect(bodies[0].matches(':popover-open')).toBe(true)
})

test('动态方向和间距读取当前值并在空值时回退', async () => {
  const host = document.body.appendChild(document.createElement('main'))
  const position = createState<AnchorPosition | undefined>(undefined)
  const margin = createState<string | undefined>(undefined)
  dispose = render(() => {
    const { popoverTrigger, popoverBody } = popover({
      popoverBody: { anchorPosition: position, triggerMargin: margin },
    })
    return <><Button is={popoverTrigger}>打开</Button><Card is={popoverBody}>说明</Card></>
  }, host)
  const body = host.querySelector<HTMLElement>('[popover]')!
  await expect.poll(() => body.style.positionArea).toBe('bottom')
  await expect.poll(() => body.style.margin).toBe('4px')
  position.set('left')
  margin.set('12px')
  await expect.poll(() => body.style.positionArea).toBe('left')
  await expect.poll(() => body.style.margin).toBe('12px')
  await expect.poll(() => getComputedStyle(body).positionTryFallbacks).toBe('flip-inline')
  position.set(undefined)
  margin.set(undefined)
  await expect.poll(() => body.style.positionArea).toBe('bottom')
  await expect.poll(() => body.style.margin).toBe('4px')
})

test('触发节点移动时，浮层跟随锚点', async () => {
  const host = document.body.appendChild(document.createElement('main'))
  const left = createState(200)
  dispose = render(() => {
    const { popoverTrigger, popoverBody } = popover()
    return <>
      <Button is={popoverTrigger} style={{ position: 'fixed', get left() { return `${val(left)}px` }, top: '140px' }}>目标</Button>
      <Card is={popoverBody}>内容</Card>
    </>
  }, host)
  const trigger = host.querySelector<HTMLButtonElement>('button')!
  const body = host.querySelector<HTMLElement>('[popover]')!
  await expect.poll(() => trigger.popoverTargetElement).toBe(body)
  await userEvent.click(trigger)
  await expect.poll(() => body.matches(':popover-open')).toBe(true)
  const before = body.getBoundingClientRect().left
  left.set(300)
  await expect.poll(() => trigger.getBoundingClientRect().left).toBe(300)
  await expect.poll(() => body.getBoundingClientRect().left).toBeGreaterThan(before + 40)
})

test('滚动时浮层跟随锚点，锚点离开滚动区域后隐藏', async () => {
  const host = document.body.appendChild(document.createElement('main'))
  dispose = render(() => {
    const { popoverTrigger, popoverBody } = popover()
    return <>
      <div data-scroller style={{ width: '300px', height: '180px', overflow: 'auto', 'margin-top': '180px' }}>
        <div style={{ height: '600px', padding: '100px 20px' }}>
          <Button is={popoverTrigger}>目标</Button>
        </div>
      </div>
      <Card is={popoverBody} style={{ width: '120px' }}>正文</Card>
    </>
  }, host)
  const scroller = host.querySelector<HTMLElement>('[data-scroller]')!
  const trigger = host.querySelector<HTMLButtonElement>('button')!
  const body = host.querySelector<HTMLElement>('[popover]')!
  await expect.poll(() => trigger.popoverTargetElement).toBe(body)
  await userEvent.click(trigger)
  await expect.poll(() => body.matches(':popover-open')).toBe(true)
  const before = body.getBoundingClientRect().top
  scroller.scrollTop = 50
  await expect.poll(() => body.getBoundingClientRect().top).toBeLessThan(before - 40)
  scroller.scrollTop = 220
  await expect.poll(() => trigger.getBoundingClientRect().bottom < scroller.getBoundingClientRect().top).toBe(true)
  const rect = body.getBoundingClientRect()
  const centerX = rect.x + rect.width / 2
  const centerY = rect.y + rect.height / 2
  expect(centerX).toBeGreaterThan(0)
  expect(centerX).toBeLessThan(window.innerWidth)
  expect(centerY).toBeGreaterThan(0)
  expect(centerY).toBeLessThan(window.innerHeight)
  await expect.poll(() => {
    return body.contains(document.elementFromPoint(centerX, centerY))
  }).toBe(false)
  expect(body.matches(':popover-open')).toBe(true)
  scroller.scrollTop = 50
  await expect.poll(() => {
    const current = body.getBoundingClientRect()
    return body.contains(document.elementFromPoint(current.x + current.width / 2, current.y + current.height / 2))
  }).toBe(true)
})

test('翻向条件作用于正文后代和伪元素，不作用于容器自身', async () => {
  const handles = [
    rules('.FlipBody', { color: 'rgb(10, 20, 30)' }),
    rules(['.FlipBody', whenPopoverFlip], { color: 'rgb(40, 50, 60)' }),
    rules('.FlipChild', { color: 'rgb(100, 0, 0)' }),
    rules(['.FlipChild', whenPopoverFlip], { color: 'rgb(0, 0, 200)' }),
    rules(['.FlipChild::before', whenPopoverFlip], { content: '"翻向"' }),
  ]
  cssRoot.mount()
  const host = document.body.appendChild(document.createElement('main'))
  const position = createState<AnchorPosition>('top')
  const top = createState(220)
  const left = createState(250)
  try {
    dispose = render(() => {
      const { popoverTrigger, popoverBody } = popover({ popoverBody: { anchorPosition: position } })
      return <>
        <Button is={popoverTrigger} style={{ position: 'fixed', get top() { return `${val(top)}px` }, get left() { return `${val(left)}px` } }}>目标</Button>
        <Card is={popoverBody} class="FlipBody" style={{ width: '120px' }}><span class="FlipChild">正文</span></Card>
      </>
    }, host)
    const trigger = host.querySelector<HTMLButtonElement>('button')!
    const body = host.querySelector<HTMLElement>('[popover]')!
    const child = host.querySelector<HTMLElement>('.FlipChild')!
    await expect.poll(() => trigger.popoverTargetElement).toBe(body)
    await userEvent.click(trigger)
    await expect.poll(() => body.matches(':popover-open')).toBe(true)
    expect(getComputedStyle(child).color).toBe('rgb(100, 0, 0)')
    top.set(4)
    await expect.poll(() => getComputedStyle(child).color).toBe('rgb(0, 0, 200)')
    expect(getComputedStyle(child, '::before').content).toBe('"翻向"')
    expect(getComputedStyle(body).color).toBe('rgb(10, 20, 30)')
    position.set('right')
    top.set(220)
    left.set(window.innerWidth - 40)
    await expect.poll(() => body.getBoundingClientRect().right < trigger.getBoundingClientRect().left).toBe(true)
    await expect.poll(() => getComputedStyle(child).color).toBe('rgb(0, 0, 200)')
    expect(getComputedStyle(body).color).toBe('rgb(10, 20, 30)')
  } finally {
    handles.forEach((handle) => handle.remove())
  }
})

test('Popover 不改变调用者的内容与材料样式', () => {
  const host = document.body.appendChild(document.createElement('main'))
  dispose = render(() => {
    const { popoverTrigger, popoverBody } = popover()
    const style = { width: '180px', padding: '7px', background: 'rgb(20, 30, 40)', border: '3px solid rgb(60, 70, 80)' }
    return <>
      <Button is={popoverTrigger}>目标</Button>
      <Card is={popoverBody} style={style}>正文</Card>
      <Card style={style}>对照</Card>
    </>
  }, host)
  const [body, baseline] = host.querySelectorAll<HTMLElement>('.Card')
  const read = (element: HTMLElement) => {
    const style = getComputedStyle(element)
    return [style.width, style.padding, style.backgroundColor, style.borderTopWidth, style.borderTopColor]
  }
  expect(read(body)).toEqual(read(baseline))
})

test('默认打开与原生 toggle 事件共享打开状态', async () => {
  const host = document.body.appendChild(document.createElement('main'))
  const onToggle = vi.fn()
  let capability!: ReturnType<typeof popover>
  dispose = render(() => {
    capability = popover({ popoverBody: { defaultOpen: true, onToggle } })
    return <>
      <Button is={capability.popoverTrigger}>目标</Button>
      <Card is={capability.popoverBody}>正文</Card>
    </>
  }, host)
  const body = host.querySelector<HTMLElement>('[popover]')!
  await expect.poll(() => body.matches(':popover-open')).toBe(true)
  await expect.poll(() => val(capability.popoverBody.controller.isOpen)).toBe(true)
  expect(val(capability.popoverTrigger.controller.isOpen)).toBe(true)
  expect(onToggle).toHaveBeenCalledWith(true, expect.any(Event))
  capability.popoverTrigger.controller.togglePopover({ force: false })
  await expect.poll(() => body.matches(':popover-open')).toBe(false)
  await expect.poll(() => val(capability.popoverBody.controller.isOpen)).toBe(false)
})

test('默认打开只读取首次完成值，后续状态改变不再打开', async () => {
  const host = document.body.appendChild(document.createElement('main'))
  const initial = createState(false)
  dispose = render(() => {
    const { popoverTrigger, popoverBody } = popover({ popoverBody: { defaultOpen: initial } })
    return <><Button is={popoverTrigger}>目标</Button><Card is={popoverBody}>正文</Card></>
  }, host)
  const trigger = host.querySelector<HTMLButtonElement>('button')!
  const body = host.querySelector<HTMLElement>('[popover]')!
  await expect.poll(() => trigger.popoverTargetElement).toBe(body)
  expect(body.matches(':popover-open')).toBe(false)
  initial.set(true)
  await new Promise((done) => setTimeout(done, 30))
  expect(body.matches(':popover-open')).toBe(false)
})

test('默认打开等待异步来源的首次值', async () => {
  const host = document.body.appendChild(document.createElement('main'))
  const initial = Promise.withResolvers<boolean>()
  dispose = render(() => {
    const { popoverTrigger, popoverBody } = popover({ popoverBody: { defaultOpen: initial.promise } })
    return <><Button is={popoverTrigger}>目标</Button><Card is={popoverBody}>正文</Card></>
  }, host)
  const body = host.querySelector<HTMLElement>('[popover]')!
  expect(body.matches(':popover-open')).toBe(false)
  initial.resolve(true)
  await expect.poll(() => body.matches(':popover-open')).toBe(true)
})

test('通用事件先于打开关闭事件，取消打开不触发 onOpen', async () => {
  const host = document.body.appendChild(document.createElement('main'))
  const calls: string[] = []
  let cancel = true
  let capability!: ReturnType<typeof popover>
  dispose = render(() => {
    capability = popover({ popoverBody: {
      onBeforeToggle(open) { calls.push(`before:${open}`) },
      onBeforeOpen(event) { calls.push('beforeOpen'); if (cancel) event.preventDefault() },
      onBeforeClose() { calls.push('beforeClose') },
      onToggle(open) { calls.push(`toggle:${open}`) },
      onOpen() { calls.push('open') },
      onClose() { calls.push('close') },
    } })
    return <><Button is={capability.popoverTrigger}>目标</Button><Card is={capability.popoverBody}>正文</Card></>
  }, host)
  const body = host.querySelector<HTMLElement>('[popover]')!
  capability.popoverBody.controller.showPopover()
  await expect.poll(() => calls).toEqual(['before:true', 'beforeOpen'])
  expect(body.matches(':popover-open')).toBe(false)
  cancel = false
  capability.popoverBody.controller.showPopover()
  await expect.poll(() => calls).toEqual(['before:true', 'beforeOpen', 'before:true', 'beforeOpen', 'toggle:true', 'open'])
  capability.popoverBody.controller.hidePopover()
  await expect.poll(() => calls).toEqual(['before:true', 'beforeOpen', 'before:true', 'beforeOpen', 'toggle:true', 'open', 'before:false', 'beforeClose', 'toggle:false', 'close'])
})

test('默认聚焦正文内第一个可聚焦节点，卸载时恢复原有 autofocus', async () => {
  const host = document.body.appendChild(document.createElement('main'))
  dispose = render(() => {
    const { popoverTrigger, popoverBody } = popover()
    return <>
      <Button is={popoverTrigger}>目标</Button>
      <Card is={popoverBody}>
        <button disabled>禁用</button>
        <div hidden><button>隐藏</button></div>
        <div style={{ display: 'none' }}><button>样式隐藏</button></div>
        <input type="hidden" />
        <input data-first tabindex={-1} />
        <button autofocus>原有自动聚焦</button>
      </Card>
    </>
  }, host)
  const trigger = host.querySelector<HTMLButtonElement>('button')!
  const body = host.querySelector<HTMLElement>('[popover]')!
  await expect.poll(() => trigger.popoverTargetElement).toBe(body)
  body.querySelector('[autofocus]')!.setAttribute('autofocus', 'original')
  await userEvent.click(trigger)
  await expect.poll(() => body.matches(':popover-open')).toBe(true)
  expect(document.activeElement).toBe(body.querySelector('[data-first]'))
  expect(body.querySelector('[data-first]')?.hasAttribute('autofocus')).toBe(true)
  const existing = [...body.querySelectorAll('button')].find((node) => node.textContent === '原有自动聚焦')!
  expect(existing.hasAttribute('autofocus')).toBe(false)
  dispose?.()
  dispose = undefined
  expect(body.querySelector('[data-first]')?.hasAttribute('autofocus')).toBe(false)
  expect(existing.getAttribute('autofocus')).toBe('original')
})

test('createDomRef 指定正文中的焦点目标，关闭由浏览器恢复焦点', async () => {
  const host = document.body.appendChild(document.createElement('main'))
  let capability!: ReturnType<typeof popover>
  dispose = render(() => {
    const [focusTarget, receiveTarget] = createDomRef<HTMLButtonElement>()
    capability = popover({ popoverBody: { autoFocus: focusTarget } })
    return <>
      <Button is={capability.popoverTrigger}>打开</Button>
      <Card is={capability.popoverBody}>
        <button autofocus>第一项</button>
        <Button domRef={receiveTarget}>指定目标</Button>
      </Card>
    </>
  }, host)
  const trigger = host.querySelector<HTMLButtonElement>('button')!
  const body = host.querySelector<HTMLElement>('[popover]')!
  await expect.poll(() => trigger.popoverTargetElement).toBe(body)
  body.querySelector('[autofocus]')!.setAttribute('autofocus', 'original')
  const focus = vi.spyOn(trigger, 'focus')
  await userEvent.click(trigger)
  await expect.poll(() => document.activeElement?.textContent).toBe('指定目标')
  const existing = [...body.querySelectorAll('button')].find((node) => node.textContent === '第一项')!
  expect(existing.hasAttribute('autofocus')).toBe(false)
  capability.popoverBody.controller.hidePopover()
  await expect.poll(() => body.matches(':popover-open')).toBe(false)
  expect(document.activeElement).toBe(trigger)
  expect(focus).not.toHaveBeenCalled()
  dispose?.()
  dispose = undefined
  expect(existing.getAttribute('autofocus')).toBe('original')
})

test('可以直接指定正文内的 HTMLElement 作为焦点目标', async () => {
  const host = document.body.appendChild(document.createElement('main'))
  const target = document.createElement('input')
  dispose = render(() => {
    const { popoverTrigger, popoverBody } = popover({ popoverBody: { autoFocus: target } })
    return <><Button is={popoverTrigger}>打开</Button><Card is={popoverBody}><button>首项</button>{target}</Card></>
  }, host)
  const trigger = host.querySelector<HTMLButtonElement>('button')!
  const body = host.querySelector<HTMLElement>('[popover]')!
  await expect.poll(() => trigger.popoverTargetElement).toBe(body)
  await userEvent.click(trigger)
  expect(document.activeElement).toBe(target)
})

test('默认焦点跳过关闭 details 的内容，并允许子节点恢复可见性', async () => {
  const host = document.body.appendChild(document.createElement('main'))
  dispose = render(() => {
    const { popoverTrigger, popoverBody } = popover()
    return <>
      <Button is={popoverTrigger}>打开</Button>
      <Card is={popoverBody}>
        <details><summary hidden>折叠标题</summary><input data-closed /></details>
        <div style={{ visibility: 'hidden' }}>
          <button style={{ visibility: 'visible' }}>可见焦点</button>
        </div>
        <button>后项</button>
      </Card>
    </>
  }, host)
  const trigger = host.querySelector<HTMLButtonElement>('button')!
  const body = host.querySelector<HTMLElement>('[popover]')!
  await expect.poll(() => trigger.popoverTargetElement).toBe(body)
  await userEvent.click(trigger)
  expect(document.activeElement?.textContent).toBe('可见焦点')
  expect(body.querySelector('[data-closed]')?.hasAttribute('autofocus')).toBe(false)
})

test('默认打开同样聚焦正文首项', async () => {
  const host = document.body.appendChild(document.createElement('main'))
  dispose = render(() => {
    const { popoverTrigger, popoverBody } = popover({ popoverBody: { defaultOpen: true } })
    return <>
      <Button is={popoverTrigger}>打开</Button>
      <Card is={popoverBody}><button>首项</button><button>后项</button></Card>
    </>
  }, host)
  const body = host.querySelector<HTMLElement>('[popover]')!
  await expect.poll(() => body.matches(':popover-open')).toBe(true)
  await expect.poll(() => document.activeElement?.textContent).toBe('首项')
})

test('后续监听取消打开不移动焦点，卸载时恢复原有 autofocus', async () => {
  const host = document.body.appendChild(document.createElement('main'))
  dispose = render(() => {
    const { popoverTrigger, popoverBody } = popover()
    return <>
      <Button is={popoverTrigger}>打开</Button>
      <Card is={popoverBody}><button>首项</button><button autofocus>原目标</button></Card>
    </>
  }, host)
  const trigger = host.querySelector<HTMLButtonElement>('button')!
  const body = host.querySelector<HTMLElement>('[popover]')!
  await expect.poll(() => trigger.popoverTargetElement).toBe(body)
  const existing = body.querySelector<HTMLElement>('[autofocus]')!
  existing.setAttribute('autofocus', 'original')
  body.addEventListener('beforetoggle', (event) => event.preventDefault(), { once: true })
  await userEvent.click(trigger)
  expect(body.matches(':popover-open')).toBe(false)
  expect(document.activeElement).toBe(trigger)
  expect(body.querySelector('button')!.hasAttribute('autofocus')).toBe(true)
  dispose?.()
  dispose = undefined
  expect(existing.getAttribute('autofocus')).toBe('original')
  expect(body.querySelector('button')!.hasAttribute('autofocus')).toBe(false)
})
