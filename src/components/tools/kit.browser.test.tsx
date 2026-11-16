/**
 * 完整 Kit 声明的浏览器验证。
 *
 * 覆盖引用门控、实例身份与配置解释的来源消费。
 *
 * 测试模板与 Flow/Button 一样先声明公共输入及完整字段协议。
 */
import { afterEach, expect, test, vi } from 'vitest'
import { createState, flush, render, val, type Source } from '@/foundation'
import type { RefReceiver } from '@/hooks/createRef'
import { Piv } from '../Piv/Piv'
import { flowGap } from '../kits/Flow/Flow.style'
import {
  kit,
  kitPropDefinition,
  type KitPropDefinition,
  type KitProps,
  type KitController,
  type KitComponent,
} from './kit'
import { componentBoundaries } from './KitMarker/KitMarker'
import type { StyleConfig } from './styleConfig'
import { Flow } from '../kits/Flow/Flow'
import type { FlowController } from '../kits/Flow/Flow.prop'
import { Button } from '../kits/Button/Button'
import type { ButtonController } from '../kits/Button/Button.prop'
import { Grid } from '../kits/Grid/Grid'
import type { GridController } from '../kits/Grid/Grid.prop'
import {
  createInactivePlugin,
  type PluginResult,
} from '../plugins/tools/createInactivePlugin'

type FixtureProps = KitProps<{
  styleConfig: { gap?: string }
  controller: FixtureController
}> & {
  value?: Source<string | undefined>
}
type FixtureDefinition = KitPropDefinition<{ value: 'state-source-view' }>
const fixtureDefinition: FixtureDefinition = {
  ...kitPropDefinition,
  value: 'state-source-view',
}
interface FixtureController extends KitController<{
  props: FixtureProps
  propDefinition: FixtureDefinition
}> {}
let dispose: (() => void) | undefined

afterEach(() => {
  dispose?.()
  dispose = undefined
  document.body.replaceChildren()
})

test('空配置保留对象及Source入口，空解释对象可显式提供并可清空配置', () => {
  type Props = KitProps<{ styleConfig: {}; controller: Controller }> & {}
  interface Controller extends KitController<{
    props: Props
    propDefinition: KitPropDefinition<{}>
  }> {}
  /**
   * 以空根解释集合接入公共配置，当前不增加具体样式字段。
   */
  const Empty: KitComponent<{ props: Props; controller: Controller }> = kit(
    { name: 'EmptyConfig', propDefinition: kitPropDefinition, styleConfig: {} },
    (props) => <Piv shadowProps={props}>{props.children}</Piv>,
  )
  const host = document.body.appendChild(document.createElement('main'))
  const config = createState<object | undefined>({})
  let controller!: Controller
  dispose = render(
    () => (
      <Empty
        styleConfig={config}
        ref={(current) => {
          controller = current
        }}
      >
        内容
      </Empty>
    ),
    host,
  )
  const element = host.firstElementChild
  expect(val(controller.props.styleConfig)).toEqual({})
  config.set({ futureOption: '值' })
  flush()
  expect(val(controller.props.styleConfig)).toEqual({ futureOption: '值' })
  controller.props.styleConfig.set(undefined)
  flush()
  expect(val(controller.props.styleConfig)).toBeUndefined()
  expect(host.firstElementChild).toBe(element)
})

test('可选动作名和区域标签缺省时，受控模式保留相同的用途说明名称', () => {
  const host = document.body.appendChild(document.createElement('main'))
  let button!: ButtonController
  let grid!: GridController
  dispose = render(
    () => (
      <>
        <Button description="保存当前内容">保存</Button>
        <Button
          description="保存当前内容"
          ref={(current) => {
            button = current
          }}
        >
          保存
        </Button>
        <Grid description="主要内容区域" />
        <Grid
          description="主要内容区域"
          ref={(current) => {
            grid = current
          }}
        />
      </>
    ),
    host,
  )
  const buttons = host.querySelectorAll('button')
  const grids = host.querySelectorAll('.Grid')
  expect(buttons[0]!.getAttribute('aria-label')).toBe('保存当前内容')
  expect(buttons[1]!.getAttribute('aria-label')).toBe('保存当前内容')
  expect(grids[0]!.getAttribute('aria-label')).toBe('主要内容区域')
  expect(grids[1]!.getAttribute('aria-label')).toBe('主要内容区域')
  button.props.name.set('另存为')
  grid.props.label.set('次要内容区域')
  flush()
  expect(buttons[1]!.getAttribute('aria-label')).toBe('另存为')
  expect(grids[1]!.getAttribute('aria-label')).toBe('次要内容区域')
  button.props.name.set(undefined)
  grid.props.label.set(undefined)
  flush()
  expect(buttons[1]!.getAttribute('aria-label')).toBe('保存当前内容')
  expect(grids[1]!.getAttribute('aria-label')).toBe('主要内容区域')
})

test('受控实例持续消费补充声明、能力和DOM引用换接，根元素不重建', () => {
  const host = document.body.appendChild(document.createElement('main'))
  const firstCleanup = vi.fn()
  const secondCleanup = vi.fn()
  const firstRef = vi.fn(() => firstCleanup)
  const secondRef = vi.fn(() => secondCleanup)
  const pluginCleanup = vi.fn()
  let controller!: FlowController
  let capability!: PluginResult<{}>
  dispose = render(() => {
    capability = createInactivePlugin({
      name: 'dynamic-kit-probe',
      pluginCore({ addProps }) {
        addProps({
          htmlProps: { 'data-probe': 'attached' },
          domRef: () => pluginCleanup,
        })
        return {}
      },
    })()
    return (
      <Flow
        shadowProps={{ htmlProps: { title: '原说明' } }}
        domRef={firstRef}
        ref={(current) => {
          controller = current
        }}
      >
        内容
      </Flow>
    )
  }, host)
  const element = host.firstElementChild as HTMLElement
  expect(element.title).toBe('原说明')
  expect(firstRef).toHaveBeenCalledOnce()

  controller.props.shadowProps.set({ htmlProps: { title: '新说明' } })
  flush()
  expect(host.firstElementChild).toBe(element)
  expect(element.title).toBe('新说明')
  controller.props.is.set(capability)
  flush()
  expect(host.firstElementChild).toBe(element)
  expect(element.dataset.probe).toBe('attached')
  controller.props.is.set(undefined)
  flush()
  expect(element.hasAttribute('data-probe')).toBe(false)
  expect(pluginCleanup).toHaveBeenCalledOnce()

  controller.props.domRef.set(() => secondRef)
  flush()
  expect(host.firstElementChild).toBe(element)
  expect(firstCleanup).toHaveBeenCalledOnce()
  expect(secondRef).toHaveBeenCalledOnce()
  expect(secondCleanup).not.toHaveBeenCalled()
  dispose()
  dispose = undefined
  expect(secondCleanup).toHaveBeenCalledOnce()
})

test('创建时ref门控控制，换接保留实例，迟到ref不补建，卸载退出集合', () => {
  const host = document.body.appendChild(document.createElement('main'))
  const boundaryCount = componentBoundaries.size
  const value = createState('初值')
  const cleanup = vi.fn()
  const resourceCleanup = vi.fn()
  let controller!: FixtureController
  let replacement!: FixtureController
  const receiver = createState<RefReceiver<FixtureController>>(() => (next) => {
    controller = next
    return cleanup
  })
  const late = createState<RefReceiver<FixtureController> | undefined>(
    undefined,
  )
  let creations = 0
  /**
   * 转交原生声明并显示业务来源，登记本实例清理。
   */
  const RenderFixture: KitComponent<{
    props: FixtureProps
    controller: FixtureController
  }> = kit(
    {
      name: 'Fixture',
      propDefinition: fixtureDefinition,
      styleConfig: { gap: (value: string) => flowGap.set(value) },
    },
    (props, context) => {
      creations++
      context.onCleanup(resourceCleanup)
      return <Piv shadowProps={props}>{props.value}</Piv>
    },
  )
  const first = {
    get ref() {
      return val(receiver)
    },
  }
  const second = {
    get ref() {
      return val(late)
    },
  }
  dispose = render(
    () => (
      <>
        <RenderFixture {...first} value={value} />
        <RenderFixture {...second} value="非受控" />
      </>
    ),
    host,
  )
  expect(RenderFixture.controllers.length).toBe(1)
  expect(componentBoundaries.size).toBe(boundaryCount + 2)
  expect(Object.hasOwn(controller.props, 'ref')).toBe(false)
  expect(Object.hasOwn(controller.props, 'id')).toBe(true)
  value.set('来源更新')
  flush()
  expect(host.firstElementChild!.textContent).toBe('来源更新')
  controller.props.value.set('指令更新')
  flush()
  expect(host.firstElementChild!.textContent).toBe('指令更新')
  receiver.set(() => (next) => {
    replacement = next
  })
  late.set(() => () => {
    throw new Error('迟到引用不能补建控制')
  })
  flush()
  expect(replacement).toBe(controller)
  expect(cleanup).toHaveBeenCalledTimes(1)
  expect(RenderFixture.controllers.length).toBe(1)
  expect(creations).toBe(2)
  dispose()
  dispose = undefined
  expect(RenderFixture.controllers.length).toBe(0)
  expect(componentBoundaries.size).toBe(boundaryCount)
  expect(resourceCleanup).toHaveBeenCalledTimes(2)
})

test('独立配置解释不要求Token，null继续交付，undefined清空不调用，核心不重建', () => {
  type MessageConfig = { message?: string | null }
  type Props = KitProps<{
    styleConfig: MessageConfig
    controller: Controller
  }> & {}
  type Definition = KitPropDefinition<{}>
  interface Controller extends KitController<{
    props: Props
    propDefinition: Definition
  }> {}
  const values: (string | null)[] = []
  const message = createState<string | null>('初值')
  const config = {
    message: (value) => {
      values.push(value)
    },
  } satisfies StyleConfig<MessageConfig>
  let controller!: Controller
  let creations = 0
  /**
   * 保持固定节点，记录配置解释收到的当前输入。
   */
  const RenderInterpreter: KitComponent<{
    props: Props
    controller: Controller
  }> = kit(
    {
      name: 'Interpreter',
      propDefinition: kitPropDefinition,
      styleConfig: config,
    },
    (props) => {
      creations++
      return <Piv shadowProps={props}>配置内容</Piv>
    },
  )
  const host = document.body.appendChild(document.createElement('main'))
  dispose = render(
    () => (
      <RenderInterpreter
        styleConfig={{ message }}
        ref={(next) => {
          controller = next
        }}
      />
    ),
    host,
  )
  expect(values.at(-1)).toBe('初值')
  message.set(null)
  flush()
  expect(values.at(-1)).toBe(null)
  controller.props.styleConfig.set({ message: '替换' })
  flush()
  expect(values.at(-1)).toBe('替换')
  const count = values.length
  controller.props.styleConfig.set(undefined)
  flush()
  expect(values).toHaveLength(count)
  expect((host.firstElementChild as HTMLElement).style.length).toBe(0)
  expect(creations).toBe(1)
})
