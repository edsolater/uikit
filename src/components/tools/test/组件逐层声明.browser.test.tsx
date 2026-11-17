/** 验证实际组件接管声明、显式字段路由与旧过滤视图退出后的生命周期。 */
import { afterEach, expect, test, vi } from 'vitest'
import { createState, flush, render, val } from '@/foundation'
import { untrack } from '@/foundation/reactivity'
import {
  Board,
  Article,
  Card,
  Checkbox,
  FormField,
  Help,
  Input,
  InputRange,
  Label,
  Select,
  SelectInput,
  Table,
  TextArea,
  type InputController,
  type InputProps,
  type ArticleController,
  type ArticleProps,
  kit,
  Piv,
  type KitComponent,
  type KitProps,
  type KitController,
  type KitPropDefinition,
  kitPropDefinition,
  createPropsDeclaration,
} from '@/components'
import { articlePropDefinition } from '../../kits/Article/Article.prop'
import { createInactivePlugin } from '../../plugins/tools/createInactivePlugin'

let dispose: (() => void) | undefined

type CaptureProps = KitProps<{ controller: CaptureController }>
interface CaptureController extends KitController<{
  props: CaptureProps
  propDefinition: KitPropDefinition<{}>
  controllerMembers: { capture(): CaptureProps['class'] }
}> {}
const CaptureFixture: KitComponent<{
  props: CaptureProps
  controller: CaptureController
}> = kit(
  { name: 'CaptureFixture', propDefinition: kitPropDefinition },
  (props, { exposeController }) => {
    exposeController({ capture: () => props.class })
    return <Piv>捕获观察</Piv>
  },
)
afterEach(() => {
  dispose?.()
  dispose = undefined
  document.body.replaceChildren()
})

test('字段控件直接交接消费视图，Plugin事件和domRef仅接入一次且动态退出', () => {
  const click = vi.fn()
  const attach = vi.fn()
  const cleanup = vi.fn()
  let builds = 0
  const capability = createInactivePlugin<{}, {}, InputProps>({
    name: '字段声明',
    pluginCore({ addProps }) {
      builds++
      addProps({
        type: 'color',
        htmlProps: { title: '能力说明' },
        on: { click },
        domRef: () => {
          attach()
          return cleanup
        },
      })
      return {}
    },
  })()
  const active = createState(true)
  const host = document.body.appendChild(document.createElement('main'))
  dispose = render(
    () => <Input is={val(active) ? capability : undefined} />,
    host,
  )
  const input = host.querySelector('input')!
  expect(input.type).toBe('color')
  expect(input.title).toBe('能力说明')
  expect(attach).toHaveBeenCalledOnce()
  input.click()
  expect(click).toHaveBeenCalledOnce()
  active.set(false)
  flush()
  expect(cleanup).toHaveBeenCalledOnce()
  expect(input.type).toBe('text')
  expect(input.title).toBe('')
  input.click()
  expect(click).toHaveBeenCalledOnce()
  expect(builds).toBe(1)
})

test('全部字段控件的补充原生声明与身份只路由到实际控件', () => {
  const host = document.body.appendChild(document.createElement('main'))
  dispose = render(
    () => (
      <>
        <FormField shadowProps={{ id: '输入身份' }}>
          <Label>输入</Label>
          <Input />
        </FormField>
        <InputRange shadowProps={{ id: '范围身份', htmlProps: { min: 2 } }} />
        <TextArea
          shadowProps={{
            id: '多行身份',
            value: '补充正文',
            placeholder: '补充提示',
          }}
        />
        <Select
          value="a"
          options={[{ value: 'a', label: '甲' }]}
          shadowProps={{ id: '选择身份', disabled: true }}
        />
        <SelectInput
          value="当前"
          options={[]}
          onQuery={() => {}}
          onSelect={() => {}}
          shadowProps={{ id: '检索身份' }}
        />
        <Checkbox
          checked={false}
          label="二态标题"
          shadowProps={{ id: '二态身份', disabled: true }}
        />
      </>
    ),
    host,
  )
  for (const id of [
    '输入身份',
    '范围身份',
    '多行身份',
    '选择身份',
    '检索身份',
    '二态身份',
  ]) {
    expect(host.querySelectorAll(`[id="${id}"]`)).toHaveLength(1)
  }
  expect(host.querySelector('label')?.htmlFor).toBe('输入身份')
  expect(host.querySelector<HTMLInputElement>('[id="范围身份"]')?.min).toBe('2')
  expect(host.querySelector<HTMLTextAreaElement>('textarea')?.placeholder).toBe(
    '补充提示',
  )
  expect(host.querySelector<HTMLSelectElement>('select')?.disabled).toBe(true)
  expect(
    host.querySelector<HTMLInputElement>('[type="checkbox"]')?.disabled,
  ).toBe(true)
  expect(
    [...host.querySelectorAll('label')].some(
      (label) => label.textContent === '二态标题',
    ),
  ).toBe(true)
})

test('身份的显式undefined阻止上下文缺省，动态删除恢复，Controller清空不回退', () => {
  const input = createState<{ id?: string }>({ id: undefined })
  const host = document.body.appendChild(document.createElement('main'))
  let controller!: InputController
  dispose = render(
    () => (
      <FormField id="上下文身份">
        <Input
          shadowProps={val(input)}
          ref={(next) => {
            controller = next
          }}
        />
      </FormField>
    ),
    host,
  )
  const element = host.querySelector('input')!
  expect(element.id).toBe('')
  input.set({})
  flush()
  expect(element.id).toBe('上下文身份')
  controller.props.id.set(undefined)
  flush()
  expect(element.id).toBe('')
})

test('多层泛型承载接收自己的补充分类，表格补充渲染器保留真实字段值', () => {
  const host = document.body.appendChild(document.createElement('main'))
  dispose = render(
    () => (
      <>
        <Board as="section" shadowProps={{ size: 'large', variant: 'solid' }} />
        <Card as="article" shadowProps={{ size: 'small', variant: 'soft' }} />
        <Table
          shadowProps={{
            data: [{ amount: 3 }],
            renderParts: { tableCell: { amount: (value) => `金额${value}` } },
          }}
        />
      </>
    ),
    host,
  )
  expect(host.querySelector('section')?.getAttribute('data-size')).toBe('large')
  expect(host.querySelector('article')?.getAttribute('data-variant')).toBe(
    'soft',
  )
  expect(host.querySelector('td')?.textContent).toBe('金额3')
})

test('Help消费自己的名称并显式重供，动态补充名称保持更新', () => {
  const label = createState('字段帮助')
  const host = document.body.appendChild(document.createElement('main'))
  dispose = render(() => <Help shadowProps={{ label }} />, host)
  const button = host.querySelector('button')!
  expect(button.getAttribute('aria-label')).toBe('字段帮助')
  label.set('更新帮助')
  flush()
  expect(button.getAttribute('aria-label')).toBe('更新帮助')
})

test('累加字段的原始undefined、Source当前undefined和Controller清空保留各自语义', () => {
  const shadow = createState('补充类')
  const direct = createState<string | undefined>(undefined)
  const controlledDirect = createState<string | undefined>('直接类')
  const host = document.body.appendChild(document.createElement('main'))
  let controller!: ArticleController
  dispose = render(
    () => (
      <>
        <Article class={undefined} shadowProps={{ class: shadow }}>
          原始清空
        </Article>
        <Article class={direct} shadowProps={{ class: shadow }} ref={() => {}}>
          来源空值
        </Article>
        <Article
          class={controlledDirect}
          shadowProps={{ class: shadow }}
          ref={(next) => {
            controller = next
          }}
        >
          干预清空
        </Article>
      </>
    ),
    host,
  )
  const [raw, source, controlled] = host.querySelectorAll('article')
  expect(raw.classList.contains('补充类')).toBe(false)
  expect(source.classList.contains('补充类')).toBe(true)
  expect(controlled.classList.contains('补充类')).toBe(true)
  controller.props.class.set('新直接类')
  flush()
  expect(controlled.classList.contains('新直接类')).toBe(true)
  expect(controlled.classList.contains('补充类')).toBe(true)
  controller.props.class.set(undefined)
  flush()
  expect(controlled.classList.contains('补充类')).toBe(false)
  shadow.set('新补充类')
  flush()
  expect(raw.classList.contains('新补充类')).toBe(false)
  expect(source.classList.contains('新补充类')).toBe(true)
  expect(controlled.classList.contains('新补充类')).toBe(false)
  controlledDirect.set('上游恢复')
  flush()
  expect(controlled.classList.contains('上游恢复')).toBe(true)
  controlledDirect.set(undefined)
  flush()
  expect(controlled.classList.contains('新补充类')).toBe(true)
})

test('核心取得的受控累加Source保持身份与动态值，包含直接指令和补充来源更新', () => {
  const warning = vi.spyOn(console, 'warn')
  let computations = 0
  let rawReads = 0
  let initialComputations = -1
  const shadow = createState(
    () => {
      computations++
      return '补充类'
    },
    { lazy: true },
  )
  const supplied = {
    get class() {
      rawReads++
      return shadow
    },
  }
  const host = document.body.appendChild(document.createElement('main'))
  let controller!: ArticleController
  const Fixture: KitComponent<{
    props: ArticleProps
    controller: ArticleController
  }> = kit(
    { name: 'CapturedSource', propDefinition: articlePropDefinition },
    (props) => {
      const source = props.class
      expect(Object.is(props.class, source)).toBe(true)
      initialComputations = computations
      return <Piv class={source} shadowProps={props} />
    },
  )
  try {
    dispose = render(
      () => (
        <Fixture
          class="直接类"
          shadowProps={supplied}
          ref={(next) => {
            controller = next
          }}
        />
      ),
      host,
    )
    const element = host.firstElementChild!
    expect(initialComputations).toBe(0)
    expect(rawReads).toBe(1)
    controller.props.class.set('新直接类')
    shadow.set('新补充类')
    flush()
    expect(element.classList.contains('新直接类')).toBe(true)
    expect(element.classList.contains('新补充类')).toBe(true)
    expect(warning).not.toHaveBeenCalled()
  } finally {
    warning.mockRestore()
  }
})

test('本地先清空再取得Source不会认领被截断的上游', () => {
  let reads = 0
  const value = createState(
    () => {
      reads++
      return '隐藏来源'
    },
    { lazy: true },
  )
  const upstream = createPropsDeclaration({ class: value }).consume()
  const host = document.body.appendChild(document.createElement('main'))
  let controller!: CaptureController
  dispose = render(
    () => (
      <CaptureFixture
        shadowProps={upstream}
        ref={(next) => {
          controller = next
        }}
      />
    ),
    host,
  )
  controller.props.class.set(undefined)
  flush()
  expect(val(controller.capture())).toBeUndefined()
  const remaining = createPropsDeclaration({ shadowProps: upstream }).consume()
  expect('class' in remaining).toBe(true)
  expect(reads).toBe(0)
})

test('Controller写入惰性Source后只取得核心Source不求值，后续仍跟随更新', () => {
  const warnings = vi.spyOn(console, 'warn')
  const current = createState('初值')
  let reads = 0
  const lazy = createState(
    () => {
      reads++
      return val(current)
    },
    { lazy: true },
  )
  const host = document.body.appendChild(document.createElement('main'))
  let controller!: CaptureController
  try {
    dispose = render(
      () => (
        <CaptureFixture
          ref={(next) => {
            controller = next
          }}
        />
      ),
      host,
    )
    controller.props.class.set(lazy)
    flush()
    const source = controller.capture()
    expect(reads).toBe(0)
    expect(Object.is(controller.capture(), source)).toBe(true)
    expect(val(source)).toBe('初值')
    current.set('更新')
    flush()
    expect(val(source)).toBe('更新')
    expect(warnings).not.toHaveBeenCalled()
  } finally {
    warnings.mockRestore()
  }
})

test('Controller写入Promise后只取得核心Source不订阅，实际消费才等待完成', async () => {
  const warnings = vi.spyOn(console, 'warn')
  const pending = Promise.withResolvers<string>()
  let subscriptions = 0
  const promise: PromiseLike<string> = {
    then(fulfilled, rejected) {
      subscriptions++
      return pending.promise.then(fulfilled, rejected)
    },
  }
  const host = document.body.appendChild(document.createElement('main'))
  let controller!: CaptureController
  try {
    dispose = render(
      () => (
        <CaptureFixture
          ref={(next) => {
            controller = next
          }}
        />
      ),
      host,
    )
    controller.props.class.set(promise)
    flush()
    const source = controller.capture()
    await Promise.resolve()
    expect(subscriptions).toBe(0)
    pending.resolve('完成')
    await expect.poll(() => val(source)).toBe('完成')
    expect(subscriptions).toBe(1)
    expect(warnings).not.toHaveBeenCalled()
  } finally {
    warnings.mockRestore()
  }
})

test('取得累加Source即占有上游声明，尚未求值时其他分支不能再次认领', () => {
  const host = document.body.appendChild(document.createElement('main'))
  let reads = 0
  const value = createState(
    () => {
      reads++
      return '上游类'
    },
    { lazy: true },
  )
  const upstream = createPropsDeclaration({ class: value }).consume()
  let initialReads = -1
  let availableAgain = true
  const Fixture: KitComponent<{
    props: ArticleProps
    controller: ArticleController
  }> = kit(
    { name: 'ClaimedSource', propDefinition: articlePropDefinition },
    (props) => {
      const source = props.class
      initialReads = reads
      const remaining = createPropsDeclaration({
        shadowProps: upstream,
      }).consume()
      availableAgain = untrack(() => 'class' in remaining)
      return <Piv class={source} />
    },
  )
  dispose = render(
    () => <Fixture shadowProps={upstream} ref={() => {}} />,
    host,
  )
  expect(initialReads).toBe(0)
  expect(availableAgain).toBe(false)
  expect(host.firstElementChild?.classList.contains('上游类')).toBe(true)
})

test('下层Marker借读上层名称后，业务取得Source仍认领最初来源', () => {
  const host = document.body.appendChild(document.createElement('main'))
  const upstream = createPropsDeclaration({ label: '上游名称' }).consume()
  let availableAgain = true
  const Child: KitComponent<{
    props: ArticleProps
    controller: ArticleController
  }> = kit(
    { name: 'BorrowedChild', propDefinition: articlePropDefinition },
    (props) => {
      const label = props.label
      const remaining = createPropsDeclaration({
        shadowProps: upstream,
      }).consume()
      availableAgain = untrack(() => 'label' in remaining)
      return <Piv label={label} />
    },
  )
  const Parent: KitComponent<{
    props: ArticleProps
    controller: ArticleController
  }> = kit(
    { name: 'BorrowedParent', propDefinition: articlePropDefinition },
    (props) => <Child shadowProps={props} ref={() => {}} />,
  )
  dispose = render(() => <Parent shadowProps={upstream} ref={() => {}} />, host)
  expect(host.firstElementChild?.getAttribute('aria-label')).toBe('上游名称')
  expect(availableAgain).toBe(false)
})

test('泛型表格的必填记录可全部来自当前层Plugin', () => {
  const capability = createInactivePlugin<
    {},
    {},
    import('../../kits/Table/Table.prop').TableProps<{ amount: number }>
  >({
    name: '表格记录',
    pluginCore({ addProps }) {
      addProps({ data: [{ amount: 7 }] })
      return {}
    },
  })()
  const host = document.body.appendChild(document.createElement('main'))
  dispose = render(() => <Table<{ amount: number }> is={capability} />, host)
  expect(host.querySelector('td')?.textContent).toBe('7')
})
