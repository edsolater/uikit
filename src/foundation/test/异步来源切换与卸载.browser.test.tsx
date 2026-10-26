import { render } from '@solidjs/web'
import {
  createState,
  val,
  Loading,
  Errored,
  createEffect,
  onCleanup,
  stateView,
} from '@/foundation'
import { afterEach, expect, test } from 'vitest'

let dispose: (() => void) | undefined
let host: HTMLDivElement | undefined
afterEach(() => {
  dispose?.()
  host?.remove()
  dispose = undefined
  host = undefined
})

test('异步来源替换丢弃迟到结果，卸载释放动作和 DOM', async () => {
  const first = Promise.withResolvers<string>()
  const second = Promise.withResolvers<string>()
  const source = createState(first.promise)
  const values: string[] = []
  let cleaned = 0
  host = document.body.appendChild(document.createElement('div'))
  dispose = render(() => {
    onCleanup(() => {
      cleaned++
    })
    createEffect(source, (value) => {
      values.push(value)
    })
    return (
      <Errored fallback={<span>失败</span>}>
        <Loading fallback={<span>等待</span>}>
          <span data-result>{val(source)}</span>
        </Loading>
      </Errored>
    )
  }, host)
  source.set(second.promise)
  second.resolve('当前请求')
  await expect
    .poll(() => host!.querySelector('[data-result]')?.textContent)
    .toBe('当前请求')
  first.resolve('过期请求')
  await first.promise
  expect(host.querySelector('[data-result]')?.textContent).toBe('当前请求')
  expect(values).toEqual(['当前请求'])
  dispose()
  expect(cleaned).toBe(1)
  expect(host.childNodes).toHaveLength(0)
  source.set('卸载后更新')
  await Promise.resolve()
  expect(values).toEqual(['当前请求'])
})

for (const empty of [null, undefined]) {
  test(`裸 Promise 与 StateView 先显示等待，完成 ${String(empty)} 后才选用空值默认值`, async () => {
    const request = Promise.withResolvers<number | null | undefined>()
    const view = stateView(request.promise)
    host = document.body.appendChild(document.createElement('div'))
    dispose = render(
      () => (
        <>
          <section data-raw>
            <Loading fallback={<span>等待</span>}>
              <span data-result>{val(request.promise, 7)}</span>
            </Loading>
          </section>
          <section data-view>
            <Loading fallback={<span>等待</span>}>
              <span data-result>{val(view, 7)}</span>
            </Loading>
          </section>
        </>
      ),
      host,
    )
    await expect
      .poll(() => host!.querySelector('[data-raw]')?.textContent)
      .toBe('等待')
    expect(host.querySelector('[data-view]')?.textContent).toBe('等待')
    expect(host.querySelectorAll('[data-result]')).toHaveLength(0)
    request.resolve(empty)
    await expect
      .poll(() =>
        [...host!.querySelectorAll('[data-result]')].map(
          (node) => node.textContent,
        ),
      )
      .toEqual(['7', '7'])
  })
}

test('裸 Promise 与 StateView 的空值默认值不截获错误边界', async () => {
  const request = Promise.withResolvers<number>()
  const view = stateView(request.promise)
  host = document.body.appendChild(document.createElement('div'))
  dispose = render(
    () => (
      <>
        <section data-raw>
          <Errored fallback={<span>失败</span>}>
            <Loading fallback={<span>等待</span>}>
              <span data-result>{val(request.promise, 7)}</span>
            </Loading>
          </Errored>
        </section>
        <section data-view>
          <Errored fallback={<span>失败</span>}>
            <Loading fallback={<span>等待</span>}>
              <span data-result>{val(view, 7)}</span>
            </Loading>
          </Errored>
        </section>
      </>
    ),
    host,
  )
  await expect
    .poll(() => host!.querySelector('[data-raw]')?.textContent)
    .toBe('等待')
  expect(host.querySelector('[data-view]')?.textContent).toBe('等待')
  request.reject(new Error('读取失败'))
  await expect
    .poll(() => host!.querySelector('[data-raw]')?.textContent)
    .toBe('失败')
  expect(host.querySelector('[data-view]')?.textContent).toBe('失败')
  expect(host.querySelectorAll('[data-result]')).toHaveLength(0)
})
