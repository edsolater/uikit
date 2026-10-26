import { render } from '@solidjs/web'
import { afterEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { AsyncStateExample } from './AsyncState.example'

let dispose: (() => void) | undefined
let host: HTMLDivElement | undefined
afterEach(() => {
  dispose?.()
  host?.remove()
  dispose = undefined
  host = undefined
})

test('异步页面从等待进入完成，DOM 显示完成值', async () => {
  host = document.body.appendChild(document.createElement('div'))
  dispose = render(() => <AsyncStateExample />, host)
  await expect
    .poll(() => host!.querySelector('[role=status]')?.textContent)
    .toBe('等待请求')
  await userEvent.click(host.querySelectorAll('button')[0])
  await expect
    .poll(() => host!.querySelector('[data-result]')?.textContent)
    .toBe('结果：请求已完成')
  expect(host.querySelector('[role=status]')).toBeNull()
  expect(host.querySelector('[role=alert]')).toBeNull()
})

test('异步页面由原生错误边界展示失败', async () => {
  host = document.body.appendChild(document.createElement('div'))
  dispose = render(() => <AsyncStateExample />, host)
  await userEvent.click(host.querySelectorAll('button')[1])
  await expect
    .poll(() => host!.querySelector('[role=alert]')?.textContent)
    .toContain('请求失败')
  expect(host.querySelector('[data-result]')).toBeNull()
})
