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
import { createPopoverPlugins } from './popover'
import type {
  AnchorGap,
  AnchorPosition,
  PopoverBodyOptions,
  PopoverTransition,
} from './popover'

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
  host.style.padding = '180px 40px'
  let capability!: ReturnType<typeof createPopoverPlugins>
  dispose = render(() => {
    capability = createPopoverPlugins()
    return (
      <>
        <Button is={capability.plugins.trigger}>打开</Button>
        <Card id="自定义浮层" is={capability.plugins.body}>
          说明
        </Card>
      </>
    )
  }, host)
  const {
    plugins: { trigger: triggerPlugin, body: bodyPlugin },
    controller,
  } = capability
  expect(controller.trigger).toBe(triggerPlugin.controller)
  expect(controller.body).toBe(bodyPlugin.controller)
  expect(controller.trigger.isOpen).toBe(controller.body.isOpen)
  expect(controller.isOpen).toBe(controller.trigger.isOpen)
  expect(controller.showPopover).toBe(controller.trigger.showPopover)
  expect(controller.hidePopover).toBe(controller.body.hidePopover)
  expect(controller.togglePopover).toBe(controller.trigger.togglePopover)
  const trigger = host.querySelector('button')!
  const body = host.querySelector<HTMLElement>('[popover]')!
  await expect.poll(() => trigger.popoverTargetElement).toBe(body)
  expect(getComputedStyle(body).display).toBe('none')
  expect(body.id).toBe('自定义浮层')
  await expect.poll(() => trigger.getAttribute('aria-expanded')).toBe('false')
  await userEvent.click(trigger)
  await expect.poll(() => body.matches(':popover-open')).toBe(true)
  expect(getComputedStyle(body).display).not.toBe('none')
  expect(body.getBoundingClientRect().bottom).toBeLessThanOrEqual(
    trigger.getBoundingClientRect().top,
  )
  await expect.poll(capability.controller.trigger.isOpen).toBe(true)
  await expect.poll(() => trigger.getAttribute('aria-expanded')).toBe('true')
  expect(val(capability.controller.body.isOpen)).toBe(true)
  capability.controller.body.hidePopover()
  await expect.poll(() => body.matches(':popover-open')).toBe(false)
  await expect.poll(() => getComputedStyle(body).display).toBe('none')
  await expect.poll(() => trigger.getAttribute('aria-expanded')).toBe('false')
  trigger.focus()
  await userEvent.keyboard('{Enter}')
  await expect.poll(() => body.matches(':popover-open')).toBe(true)
  await userEvent.keyboard('{Enter}')
  await expect.poll(() => body.matches(':popover-open')).toBe(false)
})

test('不同组合不串联，取消打开保持关闭', async () => {
  const host = document.body.appendChild(document.createElement('main'))
  const cancel = vi.fn(({ open, event }: { open: boolean; event: Event }) => {
    if (open) event.preventDefault()
  })
  let first!: ReturnType<typeof createPopoverPlugins>
  let second!: ReturnType<typeof createPopoverPlugins>
  dispose = render(() => {
    first = createPopoverPlugins({ body: { popover: 'manual' } })
    second = createPopoverPlugins({
      body: { popover: 'manual', onBeforeToggle: cancel },
    })
    return (
      <>
        <Button is={first.plugins.trigger}>第一项</Button>
        <Card is={first.plugins.body}>第一正文</Card>
        <Button is={second.plugins.trigger}>第二项</Button>
        <Card is={second.plugins.body}>第二正文</Card>
      </>
    )
  }, host)
  const bodies = host.querySelectorAll<HTMLElement>('[popover]')
  first.controller.trigger.showPopover()
  await expect.poll(() => bodies[0].matches(':popover-open')).toBe(true)
  second.controller.body.showPopover()
  await expect.poll(() => cancel).toHaveBeenCalled()
  expect(bodies[1].matches(':popover-open')).toBe(false)
  expect(val(second.controller.body.isOpen)).toBe(false)
  expect(bodies[0].matches(':popover-open')).toBe(true)
})

test('动态方向和间距读取当前值并在空值时回退', async () => {
  const host = document.body.appendChild(document.createElement('main'))
  const position = createState<AnchorPosition | undefined>(undefined)
  const gap = createState<AnchorGap | undefined>(undefined)
  dispose = render(() => {
    const {
      plugins: { trigger: popoverTrigger, body: popoverBody },
    } = createPopoverPlugins({
      body: { $anchorPosition: position, $anchorGap: gap },
    })
    return (
      <>
        <Button is={popoverTrigger}>打开</Button>
        <Card is={popoverBody}>说明</Card>
      </>
    )
  }, host)
  const body = host.querySelector<HTMLElement>('[popover]')!
  await expect.poll(() => body.style.positionArea).toBe('top')
  await expect.poll(() => getComputedStyle(body).margin).toBe('4px')
  position.set('left')
  gap.set('lg')
  await expect.poll(() => body.style.positionArea).toBe('left')
  await expect.poll(() => getComputedStyle(body).margin).toBe('8px')
  await expect
    .poll(() => getComputedStyle(body).positionTryFallbacks)
    .toBe('flip-inline')
  gap.set('sm')
  await expect.poll(() => getComputedStyle(body).margin).toBe('2px')
  gap.set('md')
  await expect.poll(() => getComputedStyle(body).margin).toBe('4px')
  position.set('bottom')
  await expect.poll(() => body.style.positionArea).toBe('bottom')
  position.set(undefined)
  gap.set(undefined)
  await expect.poll(() => body.style.positionArea).toBe('top')
  await expect.poll(() => getComputedStyle(body).margin).toBe('4px')
})

test('触发节点移动时，浮层跟随锚点', async () => {
  const host = document.body.appendChild(document.createElement('main'))
  const left = createState(200)
  dispose = render(() => {
    const {
      plugins: { trigger: popoverTrigger, body: popoverBody },
    } = createPopoverPlugins()
    return (
      <>
        <Button
          is={popoverTrigger}
          style={{
            position: 'fixed',
            get left() {
              return `${val(left)}px`
            },
            top: '140px',
          }}
        >
          目标
        </Button>
        <Card is={popoverBody}>内容</Card>
      </>
    )
  }, host)
  const trigger = host.querySelector<HTMLButtonElement>('button')!
  const body = host.querySelector<HTMLElement>('[popover]')!
  await expect.poll(() => trigger.popoverTargetElement).toBe(body)
  await userEvent.click(trigger)
  await expect.poll(() => body.matches(':popover-open')).toBe(true)
  const before = body.getBoundingClientRect().left
  left.set(300)
  await expect.poll(() => trigger.getBoundingClientRect().left).toBe(300)
  await expect
    .poll(() => body.getBoundingClientRect().left)
    .toBeGreaterThan(before + 40)
})

test('滚动时浮层跟随锚点，锚点离开滚动区域后隐藏', async () => {
  const host = document.body.appendChild(document.createElement('main'))
  dispose = render(() => {
    const {
      plugins: { trigger: popoverTrigger, body: popoverBody },
    } = createPopoverPlugins()
    return (
      <>
        <div
          data-scroller
          style={{
            'width': '300px',
            'height': '180px',
            'overflow': 'auto',
            'margin-top': '180px',
          }}
        >
          <div style={{ height: '600px', padding: '100px 20px' }}>
            <Button is={popoverTrigger}>目标</Button>
          </div>
        </div>
        <Card is={popoverBody} style={{ width: '120px' }}>
          正文
        </Card>
      </>
    )
  }, host)
  const scroller = host.querySelector<HTMLElement>('[data-scroller]')!
  const trigger = host.querySelector<HTMLButtonElement>('button')!
  const body = host.querySelector<HTMLElement>('[popover]')!
  await expect.poll(() => trigger.popoverTargetElement).toBe(body)
  await userEvent.click(trigger)
  await expect.poll(() => body.matches(':popover-open')).toBe(true)
  const before = body.getBoundingClientRect().top
  scroller.scrollTop = 50
  await expect
    .poll(() => body.getBoundingClientRect().top)
    .toBeLessThan(before - 40)
  scroller.scrollTop = 220
  await expect
    .poll(
      () =>
        trigger.getBoundingClientRect().bottom <
        scroller.getBoundingClientRect().top,
    )
    .toBe(true)
  const rect = body.getBoundingClientRect()
  const centerX = rect.x + rect.width / 2
  const centerY = rect.y + rect.height / 2
  expect(centerX).toBeGreaterThan(0)
  expect(centerX).toBeLessThan(window.innerWidth)
  expect(centerY).toBeGreaterThan(0)
  expect(centerY).toBeLessThan(window.innerHeight)
  await expect
    .poll(() => {
      return body.contains(document.elementFromPoint(centerX, centerY))
    })
    .toBe(false)
  expect(body.matches(':popover-open')).toBe(true)
  scroller.scrollTop = 50
  await expect
    .poll(() => {
      const current = body.getBoundingClientRect()
      return body.contains(
        document.elementFromPoint(
          current.x + current.width / 2,
          current.y + current.height / 2,
        ),
      )
    })
    .toBe(true)
})

test('翻向条件作用于正文后代和伪元素，不作用于容器自身', async () => {
  const handles = [
    rules('.FlipBody', { color: 'rgb(10, 20, 30)' }),
    rules(['.FlipBody', whenPopoverFlip], { color: 'rgb(40, 50, 60)' }),
    rules('.FlipChild', { color: 'rgb(100, 0, 0)' }),
    rules(['.FlipChild', whenPopoverFlip], { color: 'rgb(0, 0, 200)' }),
    rules(['.FlipChild', '&::before', whenPopoverFlip], { content: '"翻向"' }),
  ]
  cssRoot.mount()
  const host = document.body.appendChild(document.createElement('main'))
  const position = createState<AnchorPosition>('top')
  const top = createState(220)
  const left = createState(250)
  try {
    dispose = render(() => {
      const {
        plugins: { trigger: popoverTrigger, body: popoverBody },
      } = createPopoverPlugins({ body: { $anchorPosition: position } })
      return (
        <>
          <Button
            is={popoverTrigger}
            style={{
              position: 'fixed',
              get top() {
                return `${val(top)}px`
              },
              get left() {
                return `${val(left)}px`
              },
            }}
          >
            目标
          </Button>
          <Card is={popoverBody} class="FlipBody" style={{ width: '120px' }}>
            <span class="FlipChild">正文</span>
          </Card>
        </>
      )
    }, host)
    const trigger = host.querySelector<HTMLButtonElement>('button')!
    const body = host.querySelector<HTMLElement>('[popover]')!
    const child = host.querySelector<HTMLElement>('.FlipChild')!
    await expect.poll(() => trigger.popoverTargetElement).toBe(body)
    await userEvent.click(trigger)
    await expect.poll(() => body.matches(':popover-open')).toBe(true)
    expect(getComputedStyle(child).color).toBe('rgb(100, 0, 0)')
    top.set(4)
    await expect
      .poll(() => getComputedStyle(child).color)
      .toBe('rgb(0, 0, 200)')
    expect(getComputedStyle(child, '::before').content).toBe('"翻向"')
    expect(getComputedStyle(body).color).toBe('rgb(10, 20, 30)')
    position.set('right')
    top.set(220)
    left.set(window.innerWidth - 40)
    await expect
      .poll(
        () =>
          body.getBoundingClientRect().right <
          trigger.getBoundingClientRect().left,
      )
      .toBe(true)
    await expect
      .poll(() => getComputedStyle(child).color)
      .toBe('rgb(0, 0, 200)')
    expect(getComputedStyle(body).color).toBe('rgb(10, 20, 30)')
  } finally {
    handles.forEach(handle => handle.remove())
  }
})

test('Popover 不改变调用者的内容与材料样式', () => {
  const host = document.body.appendChild(document.createElement('main'))
  dispose = render(() => {
    const {
      plugins: { trigger: popoverTrigger, body: popoverBody },
    } = createPopoverPlugins()
    const style = {
      width: '180px',
      padding: '7px',
      background: 'rgb(20, 30, 40)',
      border: '3px solid rgb(60, 70, 80)',
    }
    return (
      <>
        <Button is={popoverTrigger}>目标</Button>
        <Card is={popoverBody} style={style}>
          正文
        </Card>
        <Card style={style}>对照</Card>
      </>
    )
  }, host)
  const [body, baseline] = host.querySelectorAll<HTMLElement>('.Card')
  const read = (element: HTMLElement) => {
    const style = getComputedStyle(element)
    return [
      style.width,
      style.padding,
      style.backgroundColor,
      style.borderTopWidth,
      style.borderTopColor,
    ]
  }
  expect(read(body)).toEqual(read(baseline))
})

test('默认打开与原生 toggle 事件共享打开状态', async () => {
  const host = document.body.appendChild(document.createElement('main'))
  const onToggle = vi.fn()
  let capability!: ReturnType<typeof createPopoverPlugins>
  dispose = render(() => {
    capability = createPopoverPlugins({ body: { defaultOpen: true, onToggle } })
    return (
      <>
        <Button is={capability.plugins.trigger}>目标</Button>
        <Card is={capability.plugins.body}>正文</Card>
      </>
    )
  }, host)
  const body = host.querySelector<HTMLElement>('[popover]')!
  await expect.poll(() => body.matches(':popover-open')).toBe(true)
  await expect.poll(capability.controller.body.isOpen).toBe(true)
  expect(val(capability.controller.trigger.isOpen)).toBe(true)
  expect(onToggle).toHaveBeenCalledWith({
    open: true,
    event: expect.any(Event),
  })
  capability.controller.trigger.togglePopover({ force: false })
  await expect.poll(() => body.matches(':popover-open')).toBe(false)
  await expect.poll(capability.controller.body.isOpen).toBe(false)
})

test('默认打开只读取首次完成值，后续状态改变不再打开', async () => {
  const host = document.body.appendChild(document.createElement('main'))
  const initial = createState(false)
  dispose = render(() => {
    const {
      plugins: { trigger: popoverTrigger, body: popoverBody },
    } = createPopoverPlugins({ body: { defaultOpen: initial } })
    return (
      <>
        <Button is={popoverTrigger}>目标</Button>
        <Card is={popoverBody}>正文</Card>
      </>
    )
  }, host)
  const trigger = host.querySelector<HTMLButtonElement>('button')!
  const body = host.querySelector<HTMLElement>('[popover]')!
  await expect.poll(() => trigger.popoverTargetElement).toBe(body)
  expect(body.matches(':popover-open')).toBe(false)
  initial.set(true)
  await new Promise(done => setTimeout(done, 30))
  expect(body.matches(':popover-open')).toBe(false)
})

test('默认打开等待异步来源的首次值', async () => {
  const host = document.body.appendChild(document.createElement('main'))
  const initial = Promise.withResolvers<boolean>()
  dispose = render(() => {
    const {
      plugins: { trigger: popoverTrigger, body: popoverBody },
    } = createPopoverPlugins({ body: { defaultOpen: initial.promise } })
    return (
      <>
        <Button is={popoverTrigger}>目标</Button>
        <Card is={popoverBody}>正文</Card>
      </>
    )
  }, host)
  const body = host.querySelector<HTMLElement>('[popover]')!
  expect(body.matches(':popover-open')).toBe(false)
  initial.resolve(true)
  await expect.poll(() => body.matches(':popover-open')).toBe(true)
})

test('Before 可以拒绝打开，无过渡的每次实际切换只开始并完成一次', async () => {
  const before: string[] = []
  const toggle: boolean[] = []
  const process: string[] = []
  let reject = true
  const body = renderTransitionBody({
    $animation: { $duration: 0 },
    onBeforeToggle({ open }) {
      before.push(`通用:${open}`)
    },
    onBeforeOpen({ event }) {
      before.push('打开')
      if (reject) event.preventDefault()
    },
    onBeforeClose() {
      before.push('关闭')
    },
    onToggle({ open }) {
      toggle.push(open)
    },
    onOpenStart({ transaction }) {
      process.push('打开开始')
      transaction.onEnd(context =>
        expect(context.transaction).toBe(transaction),
      )
    },
    onOpenEnd() {
      process.push('打开完成')
    },
    onCloseStart() {
      process.push('关闭开始')
    },
    onCloseEnd() {
      process.push('关闭完成')
    },
    onCancel() {
      process.push('取消')
    },
  })
  body.showPopover()
  await new Promise(requestAnimationFrame)
  expect(body.matches(':popover-open')).toBe(false)
  expect(process).toEqual([])
  expect(toggle).toEqual([])
  reject = false
  body.showPopover()
  expect(hostTransitions(body)).toEqual([])
  body.hidePopover()
  await expect
    .poll(() => process)
    .toEqual(['打开开始', '打开完成', '关闭开始', '关闭完成'])
  expect(before).toEqual([
    '通用:true',
    '打开',
    '通用:true',
    '打开',
    '通用:false',
    '关闭',
  ])
  await expect.poll(() => toggle).toEqual([false])
})

test('打开状态回调同步关闭正文时，两次实际切换都交付完整过程', async () => {
  const phases: string[] = []
  const body = renderTransitionBody({
    $animation: { $duration: 0 },
    onToggle({ open }) {
      if (open) body.hidePopover()
    },
    onOpenStart() {
      phases.push('打开开始')
    },
    onOpenEnd() {
      phases.push('打开完成')
    },
    onCloseStart() {
      phases.push('关闭开始')
    },
    onCloseEnd() {
      phases.push('关闭完成')
    },
  })
  body.showPopover()
  await expect
    .poll(() => phases)
    .toEqual(['打开开始', '打开完成', '关闭开始', '关闭完成'])
  expect(body.matches(':popover-open')).toBe(false)
})

/** 用实际正文和原生显隐切换观测宿主属性；样式只属于本用例的夹具。 */
function renderTransitionBody(options: PopoverBodyOptions, css = '') {
  const host = document.body.appendChild(document.createElement('main'))
  host.appendChild(document.createElement('style')).textContent = css
  dispose = render(() => {
    const { plugins } = createPopoverPlugins({
      body: { popover: 'manual', ...options },
    })
    return (
      <>
        <Button is={plugins.trigger}>触发</Button>
        <Card class="TransitionSubject" is={plugins.body}>
          <span>内容</span>
        </Card>
      </>
    )
  }, host)
  const body = host.querySelector<HTMLElement>('[popover]')!
  body.getBoundingClientRect()
  return body
}

function hostTransitions(body: HTMLElement) {
  return body
    .getAnimations()
    .filter(
      (animation): animation is CSSTransition =>
        animation instanceof CSSTransition,
    )
}

function transitionFor(body: HTMLElement, property: string) {
  return hostTransitions(body).find(
    animation => animation.transitionProperty === property,
  )
}

test('默认淡入淡出，关闭后自动退出顶层，宿主颜色动画不会延迟开关', async () => {
  const phases: string[] = []
  const body = renderTransitionBody({
    onOpenStart() {
      phases.push('打开开始')
    },
    onOpenEnd() {
      phases.push('打开完成')
    },
    onCloseStart() {
      phases.push('关闭开始')
    },
    onCloseEnd() {
      phases.push('关闭完成')
    },
  })
  body.style.opacity = '0.45'
  body.style.display = 'flex'
  body.showPopover()
  const color = body.animate({ color: ['red', 'blue'] }, 90_000)
  const opacity = transitionFor(body, 'opacity')!
  expect(opacity.effect!.getTiming().duration).toBe(160)
  expect(getComputedStyle(body).transitionTimingFunction.split(',')[0]).toBe(
    'ease',
  )
  await expect.poll(() => phases).toEqual(['打开开始', '打开完成'])
  expect(Number(getComputedStyle(body).opacity)).toBeCloseTo(0.45)
  expect(getComputedStyle(body).display).toBe('flex')
  expect(color.playState).toBe('running')
  body.hidePopover()
  expect(body.matches(':popover-open')).toBe(false)
  expect(getComputedStyle(body).display).not.toBe('none')
  expect(getComputedStyle(body).getPropertyValue('overlay')).toBe('auto')
  const fading = transitionFor(body, 'opacity')!
  fading.currentTime = Number(fading.effect!.getComputedTiming().endTime) * 0.94
  expect(Number(getComputedStyle(body).opacity)).toBeLessThan(0.05)
  await expect
    .poll(() => phases)
    .toEqual(['打开开始', '打开完成', '关闭开始', '关闭完成'])
  await expect.poll(() => body.getClientRects().length).toBe(0)
  expect(getComputedStyle(body).display).toBe('none')
  expect(getComputedStyle(body).getPropertyValue('overlay')).toBe('none')
})

for (const terminal of ['完成', '取消'] as const) {
  test(`${terminal}时配置回调和单个订阅抛错，后续订阅仍收到同一次事务`, async () => {
    const configuredError = new Error('配置回调异常')
    const subscribedError = new Error('订阅异常')
    const report = vi.spyOn(window, 'reportError').mockImplementation(() => {})
    const received = vi.fn()
    let opening: PopoverTransition | undefined
    function fail() {
      throw configuredError
    }
    try {
      const body = renderTransitionBody({
        $animation: { $duration: 60_000 },
        onOpenStart({ transaction }) {
          opening = transaction
          const subscribe = terminal === '完成' ? 'onEnd' : 'onCancel'
          transaction[subscribe](() => {
            throw subscribedError
          })
          transaction[subscribe](received)
        },
        onOpenEnd: fail,
        onCancel: fail,
      })
      body.showPopover()
      await expect.poll(() => opening).toBeDefined()
      const animation = transitionFor(body, 'opacity')!
      if (terminal === '完成') animation.finish()
      else animation.cancel()
      await expect.poll(() => received.mock.calls.length).toBe(1)
      expect(received.mock.calls[0][0].transaction).toBe(opening)
      expect(report.mock.calls.map(([error]) => error)).toEqual([
        configuredError,
        subscribedError,
      ])
    } finally {
      report.mockRestore()
    }
  })
}

for (const [label, animation, duration, easing] of [
  ['单独覆盖时长', { $duration: 800 }, 800, 'ease'],
  ['单独覆盖缓动', { $easing: 'linear' }, 160, 'linear'],
] as const) {
  test(`${label}时另一项沿用默认值，结束后登记不回放`, async () => {
    let opening!: PopoverTransition
    const ended = vi.fn()
    const body = renderTransitionBody({
      $animation: animation,
      onOpenStart({ transaction }) {
        opening = transaction
        transaction.onEnd(ended)
      },
    })
    body.showPopover()
    expect(transitionFor(body, 'opacity')!.effect!.getTiming().duration).toBe(
      duration,
    )
    expect(getComputedStyle(body).transitionTimingFunction.split(',')[0]).toBe(
      easing,
    )
    await expect.poll(() => ended.mock.calls.length, { timeout: 2500 }).toBe(1)
    expect(ended.mock.calls[0][0].transaction).toBe(opening)
    const late = vi.fn()
    opening.onEnd(late)
    expect(late).not.toHaveBeenCalled()
  })
}

test('连续反向建立独立过程，拒绝反向保留原段，卸载取消活动段', async () => {
  const sequence: string[] = []
  const starters: PopoverTransition[] = []
  const ends = vi.fn()
  const canceled: typeof starters = []
  const localCanceled: typeof starters = []
  let reject = false
  const start: NonNullable<PopoverBodyOptions['onOpenStart']> = ({
    transaction,
  }) => {
    starters.push(transaction)
    sequence.push(`开始:${transaction.direction}`)
    transaction.onEnd(ends)
    transaction.onCancel(context => {
      localCanceled.push(context.transaction)
    })
  }
  const body = renderTransitionBody({
    $animation: { $duration: 60_000 },
    onBeforeOpen({ event }) {
      if (reject) event.preventDefault()
    },
    onOpenStart: start,
    onCloseStart: start,
    onCancel({ transaction }) {
      canceled.push(transaction)
      sequence.push(`取消:${transaction.direction}`)
    },
  })
  body.showPopover()
  await expect.poll(() => starters.length).toBe(1)
  const opening = transitionFor(body, 'opacity')!
  expect(getComputedStyle(body).display).not.toBe('none')
  body.hidePopover()
  await expect.poll(() => starters.length).toBe(2)
  const closing =
    transitionFor(body, 'overlay') ?? transitionFor(body, 'opacity')!
  expect(opening.playState).toBe('idle')
  expect(getComputedStyle(body).display).not.toBe('none')
  expect(body.matches(':popover-open')).toBe(false)
  reject = true
  body.showPopover()
  await new Promise(requestAnimationFrame)
  expect(body.matches(':popover-open')).toBe(false)
  expect(canceled).toEqual([starters[0]])
  reject = false
  expect(hostTransitions(body)).toContain(closing)
  body.showPopover()
  await expect.poll(() => starters.length).toBe(3)
  const reopened = transitionFor(body, 'opacity')!
  const motions = [opening, closing, reopened]
  expect(new Set(motions).size).toBe(3)
  dispose!()
  dispose = undefined
  expect(sequence).toEqual([
    '开始:open',
    '取消:open',
    '开始:close',
    '取消:close',
    '开始:open',
    '取消:open',
  ])
  expect(new Set(starters).size).toBe(3)
  for (const [index, transaction] of starters.entries()) {
    expect(canceled[index]).toBe(transaction)
    expect(localCanceled[index]).toBe(transaction)
  }
  expect(body.isConnected).toBe(false)
  expect(ends).not.toHaveBeenCalled()
})

test('打开过程被反向取消时同步卸载，关闭过程不会在卸载后启动', async () => {
  const phases: string[] = []
  const body = renderTransitionBody({
    $animation: { $duration: 60_000 },
    onOpenStart() {
      phases.push('打开')
    },
    onCloseStart() {
      phases.push('关闭')
    },
    onCancel() {
      phases.push('取消')
      dispose!()
      dispose = undefined
    },
  })
  body.showPopover()
  await expect.poll(() => phases).toEqual(['打开'])
  body.hidePopover()
  await expect.poll(() => body.isConnected).toBe(false)
  await new Promise(requestAnimationFrame)
  expect(phases).toEqual(['打开', '取消'])
})

test('默认聚焦正文内第一个可聚焦节点，卸载时恢复原有 autofocus', async () => {
  const host = document.body.appendChild(document.createElement('main'))
  dispose = render(() => {
    const {
      plugins: { trigger: popoverTrigger, body: popoverBody },
    } = createPopoverPlugins()
    return (
      <>
        <Button is={popoverTrigger}>目标</Button>
        <Card is={popoverBody}>
          <button disabled>禁用</button>
          <div hidden>
            <button>隐藏</button>
          </div>
          <div style={{ display: 'none' }}>
            <button>样式隐藏</button>
          </div>
          <input type="hidden" />
          <input data-first tabindex={-1} />
          <button autofocus>原有自动聚焦</button>
        </Card>
      </>
    )
  }, host)
  const trigger = host.querySelector<HTMLButtonElement>('button')!
  const body = host.querySelector<HTMLElement>('[popover]')!
  await expect.poll(() => trigger.popoverTargetElement).toBe(body)
  body.querySelector('[autofocus]')!.setAttribute('autofocus', 'original')
  await userEvent.click(trigger)
  await expect.poll(() => body.matches(':popover-open')).toBe(true)
  const first = body.querySelector('[data-first]')!
  expect(document.activeElement).toBe(first)
  expect(body.querySelector('[data-first]')?.hasAttribute('autofocus')).toBe(
    true,
  )
  const existing = [...body.querySelectorAll('button')].find(
    node => node.textContent === '原有自动聚焦',
  )!
  expect(existing.hasAttribute('autofocus')).toBe(false)
  dispose?.()
  dispose = undefined
  expect(first.hasAttribute('autofocus')).toBe(false)
  expect(existing.getAttribute('autofocus')).toBe('original')
})

test('createDomRef 指定正文中的焦点目标，关闭由浏览器恢复焦点', async () => {
  const host = document.body.appendChild(document.createElement('main'))
  let capability!: ReturnType<typeof createPopoverPlugins>
  dispose = render(() => {
    const [focusTarget, receiveTarget] = createDomRef<HTMLButtonElement>()
    capability = createPopoverPlugins({ body: { autoFocus: focusTarget } })
    return (
      <>
        <Button is={capability.plugins.trigger}>打开</Button>
        <Card is={capability.plugins.body}>
          <button autofocus>第一项</button>
          <Button domRef={receiveTarget}>指定目标</Button>
        </Card>
      </>
    )
  }, host)
  const trigger = host.querySelector<HTMLButtonElement>('button')!
  const body = host.querySelector<HTMLElement>('[popover]')!
  await expect.poll(() => trigger.popoverTargetElement).toBe(body)
  body.querySelector('[autofocus]')!.setAttribute('autofocus', 'original')
  const focus = vi.spyOn(trigger, 'focus')
  await userEvent.click(trigger)
  await expect.poll(() => document.activeElement?.textContent).toBe('指定目标')
  const existing = [...body.querySelectorAll('button')].find(
    node => node.textContent === '第一项',
  )!
  expect(existing.hasAttribute('autofocus')).toBe(false)
  capability.controller.body.hidePopover()
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
    const {
      plugins: { trigger: popoverTrigger, body: popoverBody },
    } = createPopoverPlugins({ body: { autoFocus: target } })
    return (
      <>
        <Button is={popoverTrigger}>打开</Button>
        <Card is={popoverBody}>
          <button>首项</button>
          {target}
        </Card>
      </>
    )
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
    const {
      plugins: { trigger: popoverTrigger, body: popoverBody },
    } = createPopoverPlugins()
    return (
      <>
        <Button is={popoverTrigger}>打开</Button>
        <Card is={popoverBody}>
          <details>
            <summary hidden>折叠标题</summary>
            <input data-closed />
          </details>
          <div style={{ visibility: 'hidden' }}>
            <button style={{ visibility: 'visible' }}>可见焦点</button>
          </div>
          <button>后项</button>
        </Card>
      </>
    )
  }, host)
  const trigger = host.querySelector<HTMLButtonElement>('button')!
  const body = host.querySelector<HTMLElement>('[popover]')!
  await expect.poll(() => trigger.popoverTargetElement).toBe(body)
  await userEvent.click(trigger)
  expect(document.activeElement?.textContent).toBe('可见焦点')
  expect(body.querySelector('[data-closed]')?.hasAttribute('autofocus')).toBe(
    false,
  )
})

test('默认打开同样聚焦正文首项', async () => {
  const host = document.body.appendChild(document.createElement('main'))
  dispose = render(() => {
    const {
      plugins: { trigger: popoverTrigger, body: popoverBody },
    } = createPopoverPlugins({ body: { defaultOpen: true } })
    return (
      <>
        <Button is={popoverTrigger}>打开</Button>
        <Card is={popoverBody}>
          <button>首项</button>
          <button>后项</button>
        </Card>
      </>
    )
  }, host)
  const body = host.querySelector<HTMLElement>('[popover]')!
  await expect.poll(() => body.matches(':popover-open')).toBe(true)
  await expect.poll(() => document.activeElement?.textContent).toBe('首项')
})

test('后续监听取消打开不移动焦点，卸载时恢复原有 autofocus', async () => {
  const host = document.body.appendChild(document.createElement('main'))
  dispose = render(() => {
    const {
      plugins: { trigger: popoverTrigger, body: popoverBody },
    } = createPopoverPlugins()
    return (
      <>
        <Button is={popoverTrigger}>打开</Button>
        <Card is={popoverBody}>
          <button>首项</button>
          <button autofocus>原目标</button>
        </Card>
      </>
    )
  }, host)
  const trigger = host.querySelector<HTMLButtonElement>('button')!
  const body = host.querySelector<HTMLElement>('[popover]')!
  await expect.poll(() => trigger.popoverTargetElement).toBe(body)
  const existing = body.querySelector<HTMLElement>('[autofocus]')!
  existing.setAttribute('autofocus', 'original')
  body.addEventListener('beforetoggle', event => event.preventDefault(), {
    once: true,
  })
  await userEvent.click(trigger)
  expect(body.matches(':popover-open')).toBe(false)
  expect(document.activeElement).toBe(trigger)
  const first = body.querySelector('button')!
  expect(first.hasAttribute('autofocus')).toBe(true)
  dispose?.()
  dispose = undefined
  expect(existing.getAttribute('autofocus')).toBe('original')
  expect(first.hasAttribute('autofocus')).toBe(false)
})

test('显隐指令同步返回 TaskResult，支持等待和取消未执行的操作', async () => {
  const host = document.body.appendChild(document.createElement('main'))
  let capability!: ReturnType<typeof createPopoverPlugins>
  dispose = render(() => {
    capability = createPopoverPlugins()
    return (
      <>
        <Button is={capability.plugins.trigger}>打开</Button>
        <Card is={capability.plugins.body}>说明</Card>
      </>
    )
  }, host)
  const body = host.querySelector<HTMLElement>('[popover]')!
  const controller = capability.controller
  const canceled = controller.showPopover.lazyExec()
  expect(typeof canceled.cancel).toBe('function')
  canceled.cancel()
  const rejected = canceled.result.catch(error => error)
  expect((await rejected).name).toBe('AbortError')
  expect(await canceled.isSuccess).toBe(false)
  expect(body.matches(':popover-open')).toBe(false)

  const shown = controller.showPopover()
  expect(await shown.result).toBeUndefined()
  expect(await shown.isSuccess).toBe(true)
  expect(body.matches(':popover-open')).toBe(true)
  expect(await controller.showPopover().isSuccess).toBe(true)
  expect(await controller.togglePopover({ force: false }).isSuccess).toBe(true)
  expect(body.matches(':popover-open')).toBe(false)
  expect(await controller.togglePopover().isSuccess).toBe(true)
  expect(body.matches(':popover-open')).toBe(true)
  expect(await controller.hidePopover().isSuccess).toBe(true)
  expect(body.matches(':popover-open')).toBe(false)
  expect(await controller.hidePopover().isSuccess).toBe(true)

  body.addEventListener('beforetoggle', event => event.preventDefault(), {
    once: true,
  })
  const blocked = controller.togglePopover({ force: true })
  expect(await blocked.result).toBeUndefined()
  expect(await blocked.isSuccess).toBe(false)
  expect(body.matches(':popover-open')).toBe(false)

  const nativeError = new DOMException('原生调用失败', 'InvalidStateError')
  vi.spyOn(body, 'showPopover').mockImplementationOnce(() => {
    throw nativeError
  })
  const failed = controller.showPopover()
  await expect(failed.result).rejects.toBe(nativeError)
  expect(await failed.isSuccess).toBe(false)
})
