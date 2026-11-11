/** 范围控件保留浏览器的真实键盘行为。 */
import { expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { render } from '@solidjs/web'
import { InputRange } from './InputRange'

test('范围输入保留原生范围、输入事件与键盘调整', async () => {
  const host = document.body.appendChild(document.createElement('main'))
  const values: number[] = []
  const dispose = render(() => <InputRange htmlProps={{ min: 0, max: 1, step: 0.1, value: 0.5 }}
    on={{ input: ({ element }) => { values.push(Number((element as HTMLInputElement).value)) } }} />, host)
  try {
    const input = host.querySelector('input')!
    expect([input.type, input.min, input.max, input.step, input.value]).toEqual(['range', '0', '1', '0.1', '0.5'])
    input.focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(input.value).toBe('0.6')
    expect(values).toEqual([0.6])
  } finally { dispose(); host.remove() }
})
