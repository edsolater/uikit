import { expect, test, vi } from 'vitest'
import { callableObjectSymbol } from '@edsolater/fnkit'
import {
  createEventListenerDiscriptor,
  toListenerDiscriptorPairs,
} from './handleOn'
import type { EventKey } from './registerEventListeners'

test('可调用对象可作为事件回调，归一声明时不提前调用', () => {
  const callback = Object.assign(
    vi.fn(() => undefined),
    {
      [callableObjectSymbol]: true as const,
    },
  )
  const [pair] = toListenerDiscriptorPairs([['click', callback]])
  expect(pair[0]).toBe('click')
  expect(pair[1].callback).toBe(callback)
  const descriptor = createEventListenerDiscriptor<EventKey>('click', callback)
  const [complete] = toListenerDiscriptorPairs(descriptor)
  expect(complete[1].callback).toBe(callback)
  expect(callback).not.toHaveBeenCalled()
})
