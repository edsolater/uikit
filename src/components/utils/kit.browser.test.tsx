/** 验证定义入口的透明范围、实例能力与可选控制生命周期。 */
import { afterEach, expect, test, vi } from 'vitest'
import { createState, flush, render, val, type Source } from '@/foundation'
import type { RefReceiver } from '@/hooks/createRef'
import { Piv } from '@/components/Piv/Piv'
import {
  componentBoundaries,
  type ComponentDescriptionProps,
} from '@/components/ComponentMarker/ComponentMarker'
import type { PropsController } from './componentPropsDirector'
import { kit, type KitRenderContext } from './kit'

const availableProps = {
  description: 'state-source-view',
  descriptionDisplay: 'state-value-view',
  value: 'state-source-view',
  ref: 'only-through-prop',
} as const
interface FixtureProps extends ComponentDescriptionProps {
  value?: Source<string | undefined>
  ref?: RefReceiver<PropsController<FixtureProps, typeof availableProps>>
}
type FixtureController = PropsController<FixtureProps, typeof availableProps>
let dispose: (() => void) | undefined
afterEach(() => {
  dispose?.()
  dispose = undefined
  document.body.replaceChildren()
})

test('无祖先根时核心只创建一次，多根范围透明，实例能力可解构并归原作用域清理', () => {
  const host = document.body.appendChild(document.createElement('div'))
  const initialBoundaries = componentBoundaries.size
  const value = createState('初值')
  const cleanup = vi.fn()
  let context: KitRenderContext
  let creations = 0
  const Fixture = kit(
    { name: 'Fixture', description: '默认用途', availableProps },
    (props: FixtureProps, capabilities) => {
      creations++
      context = capabilities
      const { onCleanup } = capabilities
      onCleanup(cleanup)
      return (
        <>
          <Piv>{props.value}</Piv>
          <Piv>{props.value}</Piv>
        </>
      )
    },
  )
  dispose = render(() => <Fixture value={value} />, host)
  expect(host.children).toHaveLength(2)
  expect(host.textContent).toBe('初值初值')
  expect(componentBoundaries.size).toBe(initialBoundaries + 1)
  const boundary = [...componentBoundaries].at(-1)!
  expect(boundary.readLabel()).toBe('Fixture · 默认用途')
  expect(document.querySelector('[popover]')).toBeNull()
  expect(context!.name).toBe('Fixture')
  const lateCleanup = vi.fn()
  const { onCleanup } = context!
  onCleanup(lateCleanup)
  value.set('新值')
  flush()
  expect(host.textContent).toBe('新值新值')
  expect(creations).toBe(1)
  expect(Fixture.controllers.length).toBe(0)
  dispose()
  dispose = undefined
  expect(cleanup).toHaveBeenCalledTimes(1)
  expect(lateCleanup).toHaveBeenCalledTimes(1)
  expect(componentBoundaries.size).toBe(initialBoundaries)
})

test('有效初始 ref 才启用控制，换接复用实例，两个定义的集合隔离', () => {
  const host = document.body.appendChild(document.createElement('div'))
  let creations = 0
  const core = (props: FixtureProps) => {
    creations++
    return <Piv>{props.value}</Piv>
  }
  const First = kit(
    { name: 'First', availableProps },
    core,
  )
  const Second = kit({ name: 'Second', availableProps }, core)
  let firstController: FixtureController
  let replacementController: FixtureController
  const cleanup = vi.fn()
  const receiver = createState<RefReceiver<FixtureController>>(
    () => (controller) => {
      firstController = controller
      return cleanup
    },
  )
  const lateReceiver = createState<RefReceiver<FixtureController> | undefined>(
    undefined,
  )
  const firstProps = {
    get ref() {
      return val(receiver)
    },
  }
  const lateProps = {
    get ref() {
      return val(lateReceiver)
    },
    value: '非受控',
  }
  dispose = render(
    () => (
      <>
        <First {...firstProps} />
        <First {...lateProps} />
        <Second ref={() => {}} value="独立" />
      </>
    ),
    host,
  )
  expect(First.controllers.length).toBe(1)
  expect(Second.controllers.length).toBe(1)
  firstController!.value.set('缺省字段可写')
  flush()
  expect(host.firstElementChild!.textContent).toBe('缺省字段可写')
  receiver.set(() => (controller) => {
    replacementController = controller
  })
  lateReceiver.set(() => () => {
    throw new Error('创建后不能追溯启用控制')
  })
  flush()
  expect(cleanup).toHaveBeenCalledTimes(1)
  expect(replacementController!).toBe(firstController!)
  expect(creations).toBe(3)
  expect(First.controllers.length).toBe(1)
  dispose()
  dispose = undefined
  expect(First.controllers.length).toBe(0)
  expect(Second.controllers.length).toBe(0)
})

test('用途覆盖与 marker 动态默认选择保持惰性，通用能力不要求 core 接收 context', () => {
  const host = document.body.appendChild(document.createElement('div'))
  const description = createState('外部用途')
  const display = createState(false)
  const Fixture = kit(
    {
      name: 'Fixture',
      description: '默认用途',
      availableProps,
      marker: () => ({
        descriptionOnly: true,
        get defaultDescriptionDisplay() {
          return val(display)
        },
      }),
    },
    (props: FixtureProps) => <Piv>{props.value}</Piv>,
  )
  dispose = render(
    () => <Fixture description={description} value="内容" />,
    host,
  )
  const boundary = [...componentBoundaries].at(-1)!
  expect(boundary.readLabel()).toBe('外部用途')
  expect(boundary.readDescriptionDisplay()).toBe(false)
  description.set('新用途')
  display.set(true)
  flush()
  expect(boundary.readLabel()).toBe('新用途')
  expect(boundary.readDescriptionDisplay()).toBe(true)
})
