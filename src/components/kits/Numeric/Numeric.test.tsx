// @vitest-environment jsdom
/** 原始值与有效位props共同决定可见数字，缺值保留斜杠。 */
import { expect, test } from 'vitest'
import { render } from '@solidjs/web'
import { flush } from 'solid-js'
import { createState } from '@/foundation'
import { Numeric } from './Numeric'

test('固定有效位并响应位数及原值变化', () => {
  const value = createState<number | undefined>(14),
    digits = createState(3)
  const host = document.createElement('div')
  const dispose = render(
    () => <Numeric value={value} significantDigits={digits} />,
    host,
  )
  try {
    expect(host.textContent).toBe('14.0')
    digits.set(4)
    flush()
    expect(host.textContent).toBe('14.00')
    value.set(0.0123456)
    flush()
    expect(host.textContent).toBe('0.01235')
    value.set(undefined)
    flush()
    expect(host.textContent).toBe('/')
  } finally {
    dispose()
  }
})
