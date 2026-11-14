// @vitest-environment jsdom
/** 百分比计算与缺值后缀行为，不将分子分母显示成计数pair。 */
import { expect, test } from 'vitest'
import { render } from '@solidjs/web'
import { flush } from 'solid-js'
import { createState } from '@/foundation'
import { Percent } from './Percent'

test('比值和有效位持续更新，零分母及缺值整项为斜杠', () => {
  const numerator = createState<number | undefined>(1),
    denominator = createState(4),
    digits = createState(3)
  const host = document.createElement('div')
  const dispose = render(
    () => (
      <Percent
        numerator={numerator}
        denominator={denominator}
        significantDigits={digits}
      />
    ),
    host,
  )
  try {
    expect(host.textContent).toBe('25.0%')
    expect(host.children).toHaveLength(1)
    numerator.set(3)
    denominator.set(8)
    flush()
    expect(host.textContent).toBe('37.5%')
    digits.set(4)
    flush()
    expect(host.textContent).toBe('37.50%')
    denominator.set(0)
    flush()
    expect(host.textContent).toBe('/')
    denominator.set(8)
    numerator.set(undefined)
    flush()
    expect(host.textContent).toBe('/')
  } finally {
    dispose()
  }
})
