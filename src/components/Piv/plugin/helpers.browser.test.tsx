import { createRoot } from 'solid-js'
import { expect, test } from 'vitest'
import { createState, Show, val, render } from '@/foundation'
import { Piv } from '../Piv'
import { createPivStructure } from './helpers'
import { defineInactivePlugin } from '@/components/plugins/tools/defineInactivePlugin'

test('Piv作为渲染根时同层附属节点进入实际宿主，卸载同步释放', async () => {
  const host = document.body.appendChild(document.createElement('main'))
  const adjacent = defineInactivePlugin({ name: 'adjacent', pluginCore({ element }) {
    createPivStructure(element).insertAfter(<Piv htmlProps={{ 'data-adjacent': true }}>附属内容</Piv>)
    return {}
  } })
  const dispose = render(() => (
    <Piv as="button" is={adjacent()}>
      主体
    </Piv>
  ), host)
  try {
    await expect
      .poll(() => host.querySelector('[data-adjacent]')?.textContent)
      .toBe('附属内容')
  } finally {
    dispose()
    host.remove()
  }
  expect(host.childNodes).toHaveLength(0)
})

test('结构插入按调用顺序挂载，内容持续响应并在作用域释放后清理', async () => {
  const host = document.createElement('div')
  const element = host.appendChild(document.createElement('div'))
  element.textContent = '主体'
  const text = createState('初始')
  const dispose = createRoot((dispose) => {
    {
      const { insertBefore, insertAfter, prependChild, appendChild } = createPivStructure(element)
      insertBefore(<span data-position="before">{val(text)}</span>)
      insertAfter(<span data-position="after-first">后甲</span>)
      insertAfter(<span data-position="after-second">后乙</span>)
      prependChild(<span data-position="prepend">前子</span>)
      appendChild(<span data-position="append">后子</span>)
    }
    return dispose
  })
  try {
    // 声明计算结束时尚未提交结构，原生 render 阶段才插入附属节点。
    expect([...host.childNodes]).toEqual([element])
    expect(element.textContent).toBe('主体')
    await expect
      .poll(() =>
        [...host.children].map((child) => child.getAttribute('data-position')),
      )
      .toEqual(['before', null, 'after-first', 'after-second'])
    expect(element.textContent).toBe('前子主体后子')
    text.set('更新')
    await expect
      .poll(() => host.querySelector('[data-position="before"]')?.textContent)
      .toBe('更新')
  } finally {
    dispose()
  }
  expect(host.childNodes).toHaveLength(1)
  expect(host.firstChild).toBe(element)
  expect(element.textContent).toBe('主体')
})

test('结构 wrapper 只在挂载时包住原元素，附属内容与清理属于原作用域', async () => {
  const host = document.createElement('div')
  const element = host.appendChild(document.createElement('div'))
  const label = createState('容器')
  const dispose = createRoot((dispose) => {
    {
      const { wrapOutside } = createPivStructure(element)
      wrapOutside(<section data-wrapper title={val(label)} />)
    }
    return dispose
  })
  try {
    await expect.poll(() => host.querySelector('[data-wrapper]')).not.toBeNull()
    const wrapper = host.querySelector<HTMLElement>('[data-wrapper]')!
    expect(wrapper.firstElementChild).toBe(element)
    expect(wrapper.title).toBe('容器')
    label.set('更新容器')
    await expect.poll(() => wrapper.title).toBe('更新容器')
  } finally {
    dispose()
  }
  expect(host.childNodes).toHaveLength(0)
})

test('结构内容支持条件、多个节点和空内容切换，卸载释放条件分支', async () => {
  const host = document.createElement('div')
  const element = host.appendChild(document.createElement('div'))
  const visible = createState(false)
  const text = createState('初始')
  const dispose = createRoot((dispose) => {
    {
      const { insertBefore } = createPivStructure(element)
      insertBefore(
        <Show when={val(visible)}>
          {[<span>{val(text)}</span>, <strong>附属</strong>]}
        </Show>,
      )
    }
    return dispose
  })
  try {
    await expect.poll(() => host.childNodes.length).toBeGreaterThan(1)
    expect(host.children).toHaveLength(1)
    visible.set(true)
    await expect.poll(() => host.textContent).toBe('初始附属')
    text.set('更新')
    await expect.poll(() => host.textContent).toBe('更新附属')
    visible.set(false)
    await expect.poll(() => host.children.length).toBe(1)
    visible.set(true)
    await expect.poll(() => host.textContent).toBe('更新附属')
  } finally {
    dispose()
  }
  expect(host.childNodes).toHaveLength(1)
  expect(host.firstChild).toBe(element)
})

test('先包裹再插入兄弟时，后续操作使用包裹后的父节点', async () => {
  const host = document.createElement('div')
  const element = host.appendChild(document.createElement('div'))
  const dispose = createRoot((dispose) => {
    {
      const { wrapOutside, insertAfter } = createPivStructure(element)
      wrapOutside(<section />)
      insertAfter(<span>后置</span>)
    }
    return dispose
  })
  try {
    await expect
      .poll(() => host.querySelector('section')?.textContent)
      .toBe('后置')
    const wrapper = host.firstElementChild!
    expect([...wrapper.children]).toEqual([
      element,
      wrapper.querySelector('span'),
    ])
    expect(host.children).toHaveLength(1)
  } finally {
    dispose()
  }
  expect(host.childNodes).toHaveLength(0)
})

test('Fragment 包裹内容使用其中的真实元素承接主体并随作用域清理', async () => {
  const host = document.createElement('div')
  const element = host.appendChild(document.createElement('div'))
  const fragment = document.createDocumentFragment()
  fragment.append('前文', document.createElement('section'), '后文')
  const dispose = createRoot((dispose) => {
    {
      const { wrapOutside } = createPivStructure(element)
      wrapOutside(fragment)
    }
    return dispose
  })
  try {
    await expect
      .poll(() => host.querySelector('section')?.firstElementChild)
      .toBe(element)
    expect(host.textContent).toBe('前文后文')
    expect(fragment.childNodes).toHaveLength(0)
  } finally {
    dispose()
  }
  expect(host.childNodes).toHaveLength(0)
})
