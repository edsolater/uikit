/** 显式字段组合的原生标签关联和隔离。 */
import { expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { render } from '@solidjs/web'
import { FormField } from './FormField'
import { Label } from '../Label/Label'
import { Input } from '../Input/Input'
import { InputRange } from '../InputRange/InputRange'
import { Select } from '../Select/Select'

test('各字段自动关联，点击标题聚焦自己的控件', async () => {
  const host = document.body.appendChild(document.createElement('main'))
  const dispose = render(() => <>
    <FormField><Label>文字</Label><Input /></FormField>
    <FormField><Label>范围</Label><InputRange /></FormField>
    <FormField><Label>选项</Label><Select value="a" options={[{ value: 'a', label: '甲' }]} /></FormField>
  </>, host)
  try {
    const labels = [...host.querySelectorAll('label')], controls = [...host.querySelectorAll('input,select')]
    expect(new Set(controls.map(control => control.id)).size).toBe(3)
    for (let i = 0; i < labels.length; i++) {
      expect(labels[i]!.htmlFor).toBe(controls[i]!.id)
      await userEvent.click(labels[i]!)
      expect(document.activeElement).toBe(controls[i])
    }
  } finally { dispose(); host.remove() }
})
