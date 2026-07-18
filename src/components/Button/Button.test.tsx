// @vitest-environment jsdom

import { render } from 'solid-js/web'
import { expect, test, vi } from 'vitest'
import { Button } from './Button'

test('Button 把自身的 onClick 动作翻译成底层 click 事件', () => {
  const host = document.createElement('div')
  const onClick = vi.fn()
  const dispose = render(() => <Button onClick={onClick}>确认</Button>, host)
  const element = host.firstElementChild as HTMLButtonElement

  element.click()

  expect(onClick).toHaveBeenCalledOnce()
  dispose()
})
