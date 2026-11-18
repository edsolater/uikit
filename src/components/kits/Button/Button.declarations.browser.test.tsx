/** Button 通过 Kit 取得补充业务声明，并只向根节点交接尚未消费的输入。 */
import { afterEach, expect, test, vi } from 'vitest'
import {
  createState,
  flush,
  render,
  val,
  Loading,
  Errored,
  type Source,
} from '@/foundation'
import { untrack } from '@/foundation/reactivity'
import { derive } from '@/hooks'
import { Button } from './Button'
import {
  buttonPropDefinition,
  type ButtonProps,
  type ButtonController,
  type ButtonSize,
} from './Button.prop'
import { createInactivePlugin } from '../../plugins/tools/createInactivePlugin'
import {
  kit,
  kitPropDefinition,
  type KitComponent,
  type KitProps,
  type KitController,
  type KitPropDefinition,
} from '../../tools/kit'
import { createPropsDeclaration } from '../../tools/propsDeclaration/shadowProps'
import { componentBoundaries } from '../../tools/ComponentIdentityMarker/ComponentIdentityMarker'
import { cssRoot } from '@/style-system'
import type { StyleConfigInputProps } from '../../tools/parseStyleConfigProps'

let dispose: (() => void) | undefined
afterEach(() => {
  dispose?.()
  dispose = undefined
  document.body.replaceChildren()
})

test('消费视图可直接 derive 字段，不产生身份探测警告或认领其他业务字段', () => {
  const warning = vi.spyOn(console, 'warn')
  const host = document.body.appendChild(document.createElement('main'))
  const size = createState<ButtonSize | undefined>('small')
  let remaining!: { size?: Source<ButtonSize | undefined>; unused?: string }
  function Probe() {
    const props = createPropsDeclaration({
      size,
      unused: '保留字段',
    }).markUsedOnRead()
    const selected = derive(props, (s) => s.size)
    remaining = createPropsDeclaration<{
      size?: Source<ButtonSize | undefined>
      unused?: string
    }>({ shadowProps: props }).markUsedOnRead()
    const content = derive(remaining, (s) => s.unused)
    return <Button size={selected}>{content}</Button>
  }
  try {
    dispose = render(() => <Probe />, host)
    const button = host.querySelector('button')!
    expect(button.dataset.size).toBe('small')
    expect(button.textContent).toBe('保留字段')
    expect('size' in remaining).toBe(false)
    size.set('large')
    flush()
    expect(button.dataset.size).toBe('large')
    expect(warning).not.toHaveBeenCalled()
  } finally {
    warning.mockRestore()
  }
})

type DeriveFixtureProps = KitProps<{
  controller: DeriveFixtureController
  domTag: 'button'
}> & {
  size?: Source<ButtonSize | undefined>
}
type DeriveFixtureDefinition = KitPropDefinition<{ size: 'source' }>
interface DeriveFixtureController extends KitController<{
  props: DeriveFixtureProps
  propDefinition: DeriveFixtureDefinition
}> {}
const deriveFixtureDefinition: DeriveFixtureDefinition = {
  ...kitPropDefinition,
  size: 'source',
}

for (const controlled of [false, true]) {
  test(`Kit ${controlled ? '受控' : '非受控'}输入直接 derive 字段，保留普通值、State、getter、换源及异步边界`, async () => {
    const warning = vi.spyOn(console, 'warn')
    const host = document.body.appendChild(document.createElement('main'))
    const current = createState<ButtonSize | undefined>('small')
    const other = createState<ButtonSize | undefined>('small')
    const selected = createState({ source: current })
    const request = Promise.withResolvers<ButtonSize>()
    const Fixture: KitComponent<{
      props: DeriveFixtureProps
      controller: DeriveFixtureController
    }> = kit(
      { name: 'DeriveFieldFixture', propDefinition: deriveFixtureDefinition },
      (props) => (
        <Button
          shadowProps={props}
          size={derive(props, (s) => s.size)}
        >
          字段派生
        </Button>
      ),
    )
    const receive = controlled ? () => undefined : undefined
    try {
      dispose = render(
        () => (
          <Errored fallback={(error) => <p>{String(error())}</p>}>
            <Loading fallback={<p>等待尺寸</p>}>
              <Fixture size="small" ref={receive} />
              <Fixture size={current} ref={receive} />
              <Fixture size={val(current)} ref={receive} />
              <Fixture size={val(selected).source} ref={receive} />
              <Fixture size={request.promise} ref={receive} />
            </Loading>
          </Errored>
        ),
        host,
      )
      request.resolve('large')
      await expect.poll(() => host.querySelectorAll('button').length).toBe(5)
      const buttons = [...host.querySelectorAll('button')]
      expect(buttons.map((button) => button.dataset.size)).toEqual([
        'small',
        'small',
        'small',
        'small',
        'large',
      ])
      current.set('large')
      flush()
      expect(buttons.map((button) => button.dataset.size)).toEqual([
        'small',
        'large',
        'large',
        'large',
        'large',
      ])
      selected.set({ source: other })
      flush()
      expect(buttons[3].dataset.size).toBe('small')
      other.set('large')
      flush()
      expect(buttons[3].dataset.size).toBe('large')
      expect(warning).not.toHaveBeenCalled()
    } finally {
      warning.mockRestore()
    }
  })
}

test('shadowProps 提供 Button 自有尺寸、状态和动作，直接 undefined 覆盖补充尺寸', () => {
  const host = document.body.appendChild(document.createElement('main'))
  const clicked = vi.fn()
  const disabled = createState(true)
  dispose = render(
    () => (
      <>
        <Button shadowProps={{ size: 'large', disabled, onClick: clicked }}>
          补充声明
        </Button>
        <Button size={undefined} shadowProps={{ size: 'large' }}>
          显式清空
        </Button>
      </>
    ),
    host,
  )
  const [button, cleared] = host.querySelectorAll('button')
  expect(button.disabled).toBe(true)
  expect(button.dataset.size).toBe('large')
  expect(cleared.hasAttribute('data-size')).toBe(false)
  disabled.set(false)
  flush()
  button.click()
  expect(clicked).toHaveBeenCalledOnce()
})

test('is 注入 Button 字段与节点能力，构建、事件、节点接入及清理都只发生一次', () => {
  const host = document.body.appendChild(document.createElement('main'))
  const clicked = vi.fn()
  const attached = vi.fn()
  const cleaned = vi.fn()
  let builds = 0
  const boundaries = componentBoundaries.size
  dispose = render(() => {
    const capability = createInactivePlugin<{}, {}, ButtonProps>({
      name: 'Button声明能力',
      pluginCore({ addProps }) {
        builds++
        addProps({
          size: 'large',
          onClick: clicked,
          label: '能力按钮',
          domRef: () => {
            attached()
            return cleaned
          },
        })
        return {}
      },
    })()
    return <Button is={capability}>能力声明</Button>
  }, host)
  const button = host.querySelector('button')!
  expect(button.dataset.size).toBe('large')
  expect(button.getAttribute('aria-label')).toBe('能力按钮')
  expect(builds).toBe(1)
  expect(attached).toHaveBeenCalledOnce()
  expect(componentBoundaries.size).toBe(boundaries + 1)
  button.click()
  expect(clicked).toHaveBeenCalledOnce()
  dispose()
  dispose = undefined
  expect(cleaned).toHaveBeenCalledOnce()
  expect(componentBoundaries.size).toBe(boundaries)
})

test('父 Kit 认领的业务字段不自动进入 Button，显式再交付可以使用', () => {
  const host = document.body.appendChild(document.createElement('main'))
  const Parent: KitComponent<{
    props: ButtonProps
    controller: ButtonController
  }> = kit(
    { name: 'ConsumptionParent', propDefinition: buttonPropDefinition },
    (props) => {
      const disabled = untrack(() => props.disabled)
      return (
        <>
          <Button shadowProps={props}>自动交接</Button>
          <Button shadowProps={props} disabled={disabled}>
            显式交付
          </Button>
        </>
      )
    },
  )
  dispose = render(() => <Parent disabled />, host)
  const [automatic, explicit] = host.querySelectorAll('button')
  expect(automatic.disabled).toBe(false)
  expect(explicit.disabled).toBe(true)
})

test('认领之后仍跟随原 getter 的值变化，不冻结业务输入', () => {
  const host = document.body.appendChild(document.createElement('main'))
  const size = createState<'small' | 'large'>('small')
  const disabled = createState(false)
  dispose = render(
    () => (
      <Button
        shadowProps={{
          get size() {
            return val(size)
          },
          get disabled() {
            return val(disabled)
          },
        }}
      >
        动态 getter
      </Button>
    ),
    host,
  )
  const button = host.querySelector('button')!
  expect(button.dataset.size).toBe('small')
  expect(button.disabled).toBe(false)
  size.set('large')
  disabled.set(true)
  flush()
  expect(button.dataset.size).toBe('large')
  expect(button.disabled).toBe(true)
})

test('具体样式配置的 undefined 覆盖快捷方式，并保留根样式交接', () => {
  const style = document.head.appendChild(document.createElement('style'))
  style.id = 'css-root'
  cssRoot.mount()
  try {
    const host = document.body.appendChild(document.createElement('main'))
    dispose = render(
      () => (
        <>
          <Button shadowProps={{ $gap: '31px' }}>补充快捷方式</Button>
          <Button $gap="31px" $styleConfig={{ $gap: undefined }}>
            具体清空
          </Button>
          <Button>默认</Button>
        </>
      ),
      host,
    )
    const [shortcut, explicit, fallback] = host.querySelectorAll('button')
    expect(getComputedStyle(shortcut).gap).toBe('31px')
    expect(getComputedStyle(explicit).gap).toBe(getComputedStyle(fallback).gap)
  } finally {
    style.remove()
  }
})

test('本层已解释的样式配置不再自动交给下层 Kit，根声明仍跟随 Source', () => {
  const host = document.body.appendChild(document.createElement('main'))
  const applied = vi.fn()
  const gap = createState('17px')
  let childHasConfig = true
  const Child: KitComponent<{
    props: ButtonProps
    controller: ButtonController
  }> = kit(
    { name: 'StyleChild', propDefinition: buttonPropDefinition },
    (props) => {
      childHasConfig = untrack(() => '$styleConfig' in props)
      return <Button shadowProps={props}>根节点</Button>
    },
  )
  const Parent: KitComponent<{
    props: ButtonProps
    controller: ButtonController
  }> = kit(
    {
      name: 'StyleParent',
      propDefinition: buttonPropDefinition,
      $styleConfig: { $gap: applied },
    },
    (props) => <Child shadowProps={props} />,
  )
  dispose = render(() => <Parent $gap={gap} />, host)
  expect(childHasConfig).toBe(false)
  expect(applied).toHaveBeenLastCalledWith('17px')
  gap.set('23px')
  flush()
  expect(applied).toHaveBeenLastCalledWith('23px')
})

test('非受控 Button 从空 shadowProps 追加 size 应立即由当前层解释', () => {
  const input = createState<Partial<ButtonProps>>({})
  const host = document.body.appendChild(document.createElement('main'))
  dispose = render(
    () => <Button shadowProps={val(input)}>动态声明</Button>,
    host,
  )
  const button = host.querySelector('button')!
  expect(button.hasAttribute('data-size')).toBe(false)
  input.set({ size: 'large' })
  flush()
  expect(button.dataset.size).toBe('large')
  input.set({ size: undefined })
  flush()
  expect(button.hasAttribute('data-size')).toBe(false)
  input.set({})
  flush()
  expect(button.hasAttribute('data-size')).toBe(false)
})

test('受控 Button 从空声明追加 size 应切换到新的显式分组', () => {
  const input = createState<Partial<ButtonProps>>({})
  const host = document.body.appendChild(document.createElement('main'))
  let controller!: ButtonController
  dispose = render(
    () => (
      <Button
        shadowProps={val(input)}
        ref={(next) => {
          controller = next
        }}
      >
        动态声明
      </Button>
    ),
    host,
  )
  const button = host.querySelector('button')!
  controller.props.size
  input.set({ size: 'large' })
  flush()
  expect(button.dataset.size).toBe('large')
  input.set({ size: undefined })
  flush()
  expect(button.hasAttribute('data-size')).toBe(false)
  input.set({})
  flush()
  expect(button.hasAttribute('data-size')).toBe(false)
})

for (const readBefore of [false, true]) {
  test(`已有 label 的 Button 动态接入 htmlProps，${readBefore ? '事先取得缺省控制字段' : '不额外取得控制字段'}`, () => {
    const host = document.body.appendChild(document.createElement('main'))
    let controller!: ButtonController
    dispose = render(
      () => (
        <Button
          label="动态宿主"
          ref={(next) => {
            controller = next
          }}
        >
          节点声明
        </Button>
      ),
      host,
    )
    const button = host.querySelector('button')!
    expect(button.getAttribute('aria-label')).toBe('动态宿主')
    if (readBefore) controller.props.htmlProps
    const capability = createInactivePlugin({
      name: '动态说明',
      pluginCore({ addProps }) {
        addProps({ htmlProps: { title: '新说明' } })
        return {}
      },
    })()
    controller.props.is.set(capability)
    flush()
    expect(button.title).toBe('新说明')
  })
}

test('空补充声明新增与移除快捷样式，具体undefined仍清空快捷值', () => {
  const style = document.head.appendChild(document.createElement('style'))
  style.id = 'css-root'
  cssRoot.mount()
  const input = createState<StyleConfigInputProps<Partial<ButtonProps>>>({})
  const host = document.body.appendChild(document.createElement('main'))
  try {
    dispose = render(
      () => <Button shadowProps={val(input)}>动态样式</Button>,
      host,
    )
    const button = host.querySelector('button')!
    const original = getComputedStyle(button).gap
    input.set({ $gap: '31px' })
    flush()
    expect(getComputedStyle(button).gap).toBe('31px')
    input.set({ $gap: '31px', $styleConfig: { $gap: undefined } })
    flush()
    expect(getComputedStyle(button).gap).toBe(original)
    input.set({})
    flush()
    expect(getComputedStyle(button).gap).toBe(original)
  } finally {
    style.remove()
  }
})

test('状态的外部声明权限跟随新增与移除，显式undefined仍由外部掌握', () => {
  const input = createState<Partial<ButtonProps>>({})
  const host = document.body.appendChild(document.createElement('main'))
  let controller!: ButtonController
  dispose = render(
    () => (
      <Button
        shadowProps={val(input)}
        ref={(next) => {
          controller = next
        }}
      >
        动态状态
      </Button>
    ),
    host,
  )
  const button = host.querySelector('button')!
  input.set({ disabled: true })
  flush()
  controller.setStatus('disabled', false)
  flush()
  expect(button.disabled).toBe(true)
  input.set({ disabled: undefined })
  flush()
  controller.setStatus('disabled', true)
  flush()
  expect(button.disabled).toBe(false)
  input.set({})
  flush()
  controller.setStatus('disabled', true)
  flush()
  expect(button.disabled).toBe(true)
})
