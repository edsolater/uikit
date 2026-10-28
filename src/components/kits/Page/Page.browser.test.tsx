import { Field } from '../Field/Field'
/** 公开组件在结构查看中有真实身份，二级组合不接管子组件样式。 */
import { afterEach, beforeEach, expect, test } from 'vitest'
import { createState, flush, Loading, render } from '@/foundation'
import { cssRoot } from '@/style-system'
import { componentBoundaries } from '@/components/ComponentWrapper/ComponentWrapper'
import {
  Page,
  Flow,
  TextArea,
  Select,
  Checkbox,
  Details,
  MessageBoard,
  Link,
  Button,
  Heading,
  Label,
  Piv,
  StructureViewFab,
} from '@/components'
import '@/css/all-base.css'

let dispose: (() => void) | undefined
let host: HTMLElement
let style: HTMLStyleElement
let originalBoundaries: number
beforeEach(() => {
  originalBoundaries = componentBoundaries.size
  style = document.head.appendChild(document.createElement('style'))
  style.id = 'css-root'
  cssRoot.mount()
  host = document.body.appendChild(document.createElement('div'))
})
afterEach(() => {
  dispose?.()
  host.remove()
  style.remove()
  expect(componentBoundaries.size).toBe(originalBoundaries)
})

function toggleView() {
  host.querySelector<HTMLButtonElement>('.StructureViewFab')!.click()
  flush()
}

test('零级不重复登记，一二级均有边界，查看关闭后保持节点与布局并清理边界', async () => {
  dispose = render(
    () => (
      <>
        <Piv>零级节点</Piv>
        <Heading level={1}>外部标题</Heading>
        <Page
          title="页面标题"
          subtitle="可见副标题"
          actions={<Button>页面动作</Button>}
        >
          <Flow>
            <Field label="多行">
              {(id) => <TextArea id={id} value="内容" />}
            </Field>
            <Field label="单选">
              {(id) => (
                <Select
                  id={id}
                  value="a"
                  options={[{ value: 'a', label: '选项' }]}
                />
              )}
            </Field>
            <Checkbox label="确认" checked={false} />
            <Details summary="详情">正文</Details>
            <MessageBoard>反馈</MessageBoard>
            <Link href="/target">目标 链接正文说明</Link>
            <Label for="help-target" help="字段帮助">
              字段
            </Label>
          </Flow>
        </Page>
        <StructureViewFab />
      </>
    ),
    host,
  )
  const page = host.querySelector<HTMLElement>('main.Page')!
  const headings = host.querySelectorAll<HTMLElement>('h1')
  const insideStyle = getComputedStyle(headings[1]!),
    outsideStyle = getComputedStyle(headings[0]!)
  for (const property of [
    'font-size',
    'font-weight',
    'color',
    'margin-top',
    'margin-bottom',
  ])
    expect(insideStyle.getPropertyValue(property)).toBe(
      outsideStyle.getPropertyValue(property),
    )
  expect(page.textContent).toContain('可见副标题')
  expect(page.textContent).toContain('链接正文说明')
  expect(page.querySelector('button')?.textContent).toBe('页面动作')
  expect(page.children).toHaveLength(2)
  const originalNodes = [...page.querySelectorAll('*')]
  const bounds = page.getBoundingClientRect().toJSON()
  const names = [...componentBoundaries].map(
    (boundary) => boundary.readLabel().split(' · ')[0],
  )
  for (const name of [
    'Page',
    'Flow',
    'Field',
    'TextArea',
    'Select',
    'Checkbox',
    'Details',
    'MessageBoard',
    'Link',
    'LabelHelp',
    'LabelHelpTrigger',
    'LabelHelpContent',
  ])
    expect(names).toContain(name)
  expect(names).not.toContain('Piv')
  toggleView()
  await expect
    .poll(() => document.querySelector('.StructureViewOverlay')?.textContent)
    .toContain('Page')
  expect(
    document.querySelector('.StructureViewOverlay')?.textContent,
  ).toContain('Flow')
  toggleView()
  await expect
    .poll(() => document.querySelector('.StructureViewOverlay:popover-open'))
    .toBeNull()
  expect([...page.querySelectorAll('*')]).toEqual(originalNodes)
  expect(page.getBoundingClientRect().toJSON()).toEqual(bounds)
})

test('页面异步标题说明及动作内容保留原有来源契约', async () => {
  let resolve!: (value: string) => void
  const title = createState(
    new Promise<string>((done) => {
      resolve = done
    }),
  )
  const description = createState('初始副标题')
  let clicks = 0
  dispose = render(
    () => (
      <Loading fallback={<Piv>等待页面</Piv>}>
        <Page
          title={title}
          subtitle={description}
          actions={
            <Button
              onClick={() => {
                clicks++
              }}
            >
              执行动作
            </Button>
          }
        >
          <MessageBoard>页面正文</MessageBoard>
        </Page>
      </Loading>
    ),
    host,
  )
  expect(host.textContent).toContain('等待页面')
  resolve('异步标题')
  await expect
    .poll(() => host.querySelector('h1')?.textContent)
    .toBe('异步标题')
  expect(host.textContent).toContain('初始副标题')
  expect(host.textContent).toContain('页面正文')
  host.querySelector<HTMLButtonElement>('button')!.click()
  expect(clicks).toBe(1)
  description.set('更新副标题')
  title.set(Promise.resolve('更新标题'))
  await expect
    .poll(() => host.querySelector('h1')?.textContent)
    .toBe('更新标题')
  expect(host.textContent).toContain('更新副标题')
})
