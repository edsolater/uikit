/** 验证两阶段动作、挂载执行与卸载清理。 */
// @vitest-environment jsdom
import { render } from '@solidjs/web'
import { createRoot, flush, mapArray } from 'solid-js'
import { expect, expectTypeOf, test } from 'vitest'
import { createEffect, onCleanup, onMount } from './createEffect'
import { createRenderEffect } from './render'
import { createState } from './createState/state'
import { val } from './createState/read'

for (const { name, register } of [
  { name: '作用域清理', register: onCleanup },
  { name: '动作返回清理', register: (cleanup: () => void) => createRenderEffect(() => 0, () => cleanup) },
  { name: '挂载返回清理', register: (cleanup: () => void) => onMount(() => cleanup) },
]) {
  test(`${name}：动态删除同步释放一次，旁读不订阅删除计算，普通计算仍禁止写入`, () => {
    const shown = createState(true)
    const incidental = createState(0)
    const active = createState(true)
    const events: string[] = []
    let passes = 0
    const scope = createRoot(dispose => {
      const rows = mapArray(() => {
        passes++
        return val(shown) ? [1] : []
      }, () => {
        register(() => { events.push('先登记'); val(incidental); active.set(false) })
        register(() => { events.push('后登记') })
        return 1
      })
      createRenderEffect(rows, () => {})
      expect(() => active.set(false)).toThrow('REACTIVE_WRITE_IN_OWNED_SCOPE')
      return { dispose }
    })
    try {
      flush()
      shown.set(false)
      flush()
      expect(events).toEqual(['后登记', '先登记'])
      expect(val(active)).toBe(false)
      const deletedPasses = passes
      incidental.set(1)
      flush()
      expect(passes).toBe(deletedPasses)
      scope.dispose()
      expect(events).toEqual(['后登记', '先登记'])
    } finally { scope.dispose() }
  })
}

for (const { name, create } of [
  { name: '普通 Effect', create: createEffect },
  { name: 'Render Effect', create: createRenderEffect },
]) {
  test(`${name}：单来源动作不收集额外依赖，旧资源先清理，再执行新动作`, () => {
    const source = createState(1)
    const incidental = createState('旁读')
    const events: string[] = []
    const dispose = createRoot(dispose => {
      create(source, value => {
        expectTypeOf(value).toEqualTypeOf<number>()
        val(incidental)
        events.push(`执行${value}`)
        return () => { events.push(`清理${value}`) }
      })
      return dispose
    })
    flush()
    expect(events).toEqual(['执行1'])
    incidental.set('变化')
    flush()
    expect(events).toEqual(['执行1'])
    source.set(2)
    flush()
    expect(events).toEqual(['执行1', '清理1', '执行2'])
    dispose()
    expect(events).toEqual(['执行1', '清理1', '执行2', '清理2'])
  })

  test(`${name}：多个独立来源保留 tuple 的位置类型并持续跟随`, () => {
    const count = createState(1)
    const label = createState('按钮')
    const values: [number, string][] = []
    const dispose = createRoot(dispose => {
      create([count, label], pair => {
        expectTypeOf(pair).toEqualTypeOf<[number, string]>()
        values.push(pair)
      })
      return dispose
    })
    flush()
    count.set(2)
    label.set('更新')
    flush()
    expect(values).toEqual([[1, '按钮'], [2, '更新']])
    dispose()
  })

  test(`${name}：计算函数产生数据，动作内的额外读取不扩大依赖`, () => {
    const count = createState(1)
    const incidental = createState(0)
    const values: number[] = []
    const dispose = createRoot(dispose => {
      create(() => val(count) * 2, value => {
        expectTypeOf(value).toEqualTypeOf<number>()
        val(incidental)
        values.push(value)
      })
      return dispose
    })
    flush()
    incidental.set(1)
    flush()
    expect(values).toEqual([2])
    count.set(2)
    flush()
    expect(values).toEqual([2, 4])
    dispose()
  })
}

test('Render Effect 的初次动作同步完成，数组值保持为单个 Source 的值', () => {
  const ids = createState(['first', 'second'])
  let current: string[] | undefined
  const dispose = createRoot(dispose => {
    createRenderEffect(ids, value => { current = value })
    expect(current).toBe(ids.read())
    return dispose
  })
  ids.set(['after'])
  flush()
  expect(current).toEqual(['after'])
  dispose()
})

test('Render Effect 保留原生第三参数的初次排队控制', () => {
  const source = createState(1)
  const values: number[] = []
  const dispose = createRoot(dispose => {
    createRenderEffect(source, value => { values.push(value) }, { schedule: true })
    expect(values).toEqual([])
    return dispose
  })
  flush()
  expect(values).toEqual([1])
  dispose()
})

test('挂载后取得 DOM，已建立的响应式动作持续更新并随卸载停止', () => {
  const host = document.createElement('div')
  const content = createState('before')
  const values: string[] = []
  const dispose = render(() => {
    let element!: HTMLDivElement
    const mounted = createState(false)
    createEffect([mounted, content], ([ready, value]) => {
      if (!ready) return
      values.push(value)
      element.textContent = value
    })
    onMount(() => {
      expect(element).toBe(host.firstElementChild)
      mounted.set(true)
    })
    return <div ref={element} />
  }, host)
  flush()
  expect(host.textContent).toBe('before')
  content.set('after')
  flush()
  expect(host.textContent).toBe('after')
  dispose()
  content.set('disposed')
  flush()
  expect(values).toEqual(['before', 'after'])
})

test('挂载动作不收集旁读依赖，返回的清理在卸载时执行一次', () => {
  const host = document.createElement('div')
  const incidental = createState(0)
  const events: string[] = []
  const dispose = render(() => {
    onMount(() => {
      val(incidental)
      events.push('挂载')
      return () => { events.push('清理') }
    })
    return <div />
  }, host)
  incidental.set(1)
  flush()
  expect(events).toEqual(['挂载'])
  dispose()
  expect(events).toEqual(['挂载', '清理'])
})
