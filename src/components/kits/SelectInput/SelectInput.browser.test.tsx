/** 可搜索选择使用真实输入与键盘交互。 */
import { expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { render } from '@solidjs/web'
import { createState, flush, val } from '@/foundation'
import { FormField } from '../FormField/FormField'
import { Label } from '../Label/Label'
import { SelectInput } from './SelectInput'
import { cssRoot } from '@/style-system'

test('点击展开、键盘选择和取消草稿，并限制标签数量', async () => {
  const host = document.body.appendChild(document.createElement('main'))
  const style = document.head.appendChild(document.createElement('style'))
  style.id = 'css-root'
  cssRoot.mount()
  const value = createState('甲'),
    queries: string[] = []
  const dispose = render(
    () => (
      <FormField>
        <Label>事件名</Label>
        <SelectInput
          value={value}
          tags={['一', '二', '三', '四'].map((label, index) => ({
            label,
            tooltip: (
              <>
                <strong>归属</strong>
                <span>{`条件${index}`}</span>
              </>
            ),
          }))}
          options={[
            { value: 'b', label: '乙' },
            { value: 'c', label: '丙' },
          ]}
          onQuery={query => queries.push(query)}
          onSelect={option => value.set(option.label)}
        />
      </FormField>
    ),
    host,
  )
  try {
    const input = host.querySelector<HTMLInputElement>('input')!,
      label = host.querySelector('label')!
    expect(label.htmlFor).toBe(input.id)
    expect(host.querySelectorAll('.SelectInput-tag')).toHaveLength(3)
    await userEvent.hover(host.querySelector('.SelectInput-tag')!)
    await expect
      .poll(() => host.querySelector('[role=tooltip]')?.textContent)
      .toBe('归属条件0')
    expect(host.querySelector('[role=tooltip] strong')?.textContent).toBe(
      '归属',
    )
    expect(host.querySelector('[role=tooltip] span')?.textContent).toBe('条件0')
    await userEvent.click(host.querySelector('.SelectInput-tag')!)
    await expect
      .poll(() =>
        host.querySelector('[role=listbox]')!.matches(':popover-open'),
      )
      .toBe(true)
    expect(document.activeElement).toBe(input)
    expect(queries).toEqual([''])
    await userEvent.keyboard('{ArrowDown}{Enter}')
    expect(val(value)).toBe('丙')
    await userEvent.click(input)
    await userEvent.keyboard('x{Escape}')
    expect(input.value).toBe('丙')
    await userEvent.unhover(input)
    value.set('外部更新')
    await expect.poll(() => input.value).toBe('外部更新')
  } finally {
    dispose()
    host.remove()
    style.remove()
  }
})

test('候选缩短后活动项仍指向现有选项，Enter选择同一项，空列表不声明活动项', async () => {
  const host = document.body.appendChild(document.createElement('main'))
  const style = document.head.appendChild(document.createElement('style'))
  style.id = 'css-root'
  cssRoot.mount()
  const options = createState([
    { value: 'one', label: '一' },
    { value: 'two', label: '二' },
    { value: 'three', label: '三' },
  ])
  const selected = vi.fn()
  const dispose = render(
    () => (
      <SelectInput
        value=""
        options={options}
        onQuery={() => {}}
        onSelect={selected}
      />
    ),
    host,
  )
  try {
    const input = host.querySelector<HTMLInputElement>('input')!
    await userEvent.click(input)
    await expect
      .poll(() =>
        host.querySelector('[role=listbox]')!.matches(':popover-open'),
      )
      .toBe(true)
    expect(document.getElementById(input.getAttribute('aria-controls')!)).toBe(
      host.querySelector('[role=listbox]'),
    )
    await userEvent.keyboard('{ArrowDown}{ArrowDown}')
    expect(input.getAttribute('aria-activedescendant')).toBe(
      host.querySelectorAll('[role=option]')[2]!.id,
    )
    expect(
      document.getElementById(input.getAttribute('aria-activedescendant')!),
    ).toBe(host.querySelectorAll('[role=option]')[2])
    const remaining = { value: 'only', label: '仅剩' }
    options.set([remaining])
    flush()
    const current = host.querySelector('[role=option]')!
    expect(input.getAttribute('aria-activedescendant')).toBe(current.id)
    expect(
      document.getElementById(input.getAttribute('aria-activedescendant')!),
    ).toBe(current)
    expect(current.getAttribute('aria-selected')).toBe('true')
    await userEvent.keyboard('{Enter}')
    expect(selected).toHaveBeenCalledExactlyOnceWith(remaining)
    options.set([])
    flush()
    expect(input.hasAttribute('aria-activedescendant')).toBe(false)
  } finally {
    dispose()
    host.remove()
    style.remove()
  }
})
