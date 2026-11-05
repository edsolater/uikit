import { render } from '@solidjs/web'
import { expect, test } from 'vitest'
import { cssRoot } from '@/style-system'
import { Piv } from '../../../Piv/Piv'
import { tabularNum } from './tabular-num'

test('数字等宽插件登记并应用排版样式', () => {
  const style = document.head.appendChild(document.createElement('style'))
  style.id = 'css-root'
  cssRoot.mount()
  const host = document.body.appendChild(document.createElement('div'))
  const dispose = render(() => <Piv is={tabularNum}>123</Piv>, host)
  try {
    const element = host.querySelector<HTMLElement>('.is\\:tabular-num')!
    expect(element).not.toBeNull()
    expect(getComputedStyle(element).fontVariantNumeric).toContain('tabular-nums')
  } finally {
    dispose()
    host.remove()
    style.remove()
  }
})
