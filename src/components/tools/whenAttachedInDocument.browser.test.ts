import { AbortController } from '@edsolater/fnkit'
import { expect, expectTypeOf, test } from 'vitest'
import { whenAttachedInDocument } from './whenAttachedInDocument'

test('已连接的元素直接交回原节点和具体类型', async () => {
  const button = document.body.appendChild(document.createElement('button'))
  try {
    const ready = whenAttachedInDocument(button)
    expectTypeOf(ready).toEqualTypeOf<Promise<HTMLButtonElement>>()
    expect(await ready).toBe(button)
  } finally {
    button.remove()
  }
})

test('Promise 已交付元素，但要等元素插入已连接的影子根才放行', async () => {
  const host = document.body.appendChild(document.createElement('div'))
  const shadow = host.attachShadow({ mode: 'closed' })
  const input = document.createElement('input')
  const reference = Promise.withResolvers<HTMLInputElement>()
  const ready = whenAttachedInDocument(reference.promise, undefined, shadow)
  let settled = false
  void ready.then(() => {
    settled = true
  })
  try {
    reference.resolve(input)
    await new Promise(requestAnimationFrame)
    expect(settled).toBe(false)
    shadow.append(input)
    expect(await ready).toBe(input)
  } finally {
    host.remove()
  }
})

test('节点位于尚未挂载的影子树，宿主接入文档后返回同一节点', async () => {
  const host = document.createElement('div')
  const shadow = host.attachShadow({ mode: 'closed' })
  const input = shadow.appendChild(document.createElement('input'))
  const ready = whenAttachedInDocument(input, undefined, shadow)
  try {
    // 此时影子树内部已稳定，只有所属文档能观测到宿主的插入。
    await new Promise(requestAnimationFrame)
    document.body.append(host)
    expect(await ready).toBe(input)
  } finally {
    host.remove()
  }
})

test('等待节点连接期间取消会以原原因拒绝，无需再挂载节点', async () => {
  const controller = new AbortController()
  const ready = whenAttachedInDocument(document.createElement('div'), controller.signal)
  await new Promise(requestAnimationFrame)
  const reason = new Error('已退出等待')
  controller.abort(reason)
  await expect(ready).rejects.toBe(reason)
})
