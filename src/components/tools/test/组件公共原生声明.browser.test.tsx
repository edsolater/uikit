/**
 * 表单控件公共原生声明的浏览器验收。
 *
 * 验证每个组件真实根接收样式身份、原生属性与 DOM 引用，并持续消费来源。
 *
 * 防止公开 KitProps 后只完成类型迁移而漏掉实际节点接线。
 */
import { expect, test } from 'vitest'
import { createState, flush, render } from '@/foundation'
import {
  Checkbox,
  FormField,
  Input,
  InputRange,
  Label,
  Select,
  SelectInput,
  TextArea,
} from '@/components'
import type { FormFieldController } from '../../kits/FormField/FormField.prop'

test('公共声明落在各自真实根，来源更新沿用原节点，字段 id 不重复', () => {
  const host = document.body.appendChild(document.createElement('main'))
  const className = createState('initial-control')
  const elements: HTMLElement[] = []
  const shared = {
    class: className,
    htmlProps: { title: '公共原生声明' },
    /**
     * 记录公共声明实际接入的根元素。
     */
    domRef: (element: HTMLElement) => {
      elements.push(element)
    },
  }
  const dispose = render(
    () => (
      <>
        <Checkbox
          {...shared}
          id="checkbox-field"
          checked={false}
          label="选项"
        />
        <FormField {...shared} id="shared-field">
          <Input />
        </FormField>
        <Input {...shared} id="input-field" />
        <InputRange {...shared} id="range-field" />
        <Select
          {...shared}
          id="select-field"
          value="one"
          options={[{ value: 'one', label: '一' }]}
        />
        <SelectInput
          {...shared}
          id="search-field"
          value=""
          options={[]}
          onQuery={() => {}}
          onSelect={() => {}}
        />
        <TextArea {...shared} id="text-field" value="内容" />
      </>
    ),
    host,
  )
  try {
    expect(elements).toHaveLength(7)
    expect(host.querySelector('.FormField')).toBe(elements[1])
    for (const element of elements) {
      expect(element.classList.contains('initial-control')).toBe(true)
      expect(element.title).toBe('公共原生声明')
    }
    for (const id of [
      'checkbox-field',
      'shared-field',
      'input-field',
      'range-field',
      'select-field',
      'search-field',
      'text-field',
    ]) {
      expect(host.querySelectorAll(`[id="${id}"]`)).toHaveLength(1)
    }
    className.set('updated-control')
    flush()
    for (const element of elements) {
      expect(element.isConnected).toBe(true)
      expect(element.classList.contains('initial-control')).toBe(false)
      expect(element.classList.contains('updated-control')).toBe(true)
    }
    expect(elements).toHaveLength(7)
  } finally {
    dispose()
    host.remove()
  }
})

test('FormField中的多行编辑与标题共享默认字段身份，显式id优先且不重复', () => {
  const host = document.body.appendChild(document.createElement('main'))
  const dispose = render(
    () => (
      <>
        <FormField>
          <Label>正文</Label>
          <TextArea value="初始内容" />
        </FormField>
        <FormField id="declared-field">
          <Label for="explicit-textarea">备注</Label>
          <TextArea id="explicit-textarea" value="备注内容" />
        </FormField>
      </>
    ),
    host,
  )
  try {
    const fields = host.querySelectorAll('.FormField')
    const label = fields[0]!.querySelector('label')!
    const textarea = fields[0]!.querySelector('textarea')!
    expect(textarea.id).not.toBe('')
    expect(label.htmlFor).toBe(textarea.id)
    expect(host.querySelectorAll(`[id="${textarea.id}"]`)).toHaveLength(1)
    expect(fields[1]!.querySelector('label')!.htmlFor).toBe('explicit-textarea')
    expect(fields[1]!.querySelector('textarea')!.id).toBe('explicit-textarea')
    expect(host.querySelectorAll('[id="explicit-textarea"]')).toHaveLength(1)
  } finally {
    dispose()
    host.remove()
  }
})

test('字段身份共用Piv值域并持续更新，显式身份优先，独立控件不强制生成id', () => {
  const host = document.body.appendChild(document.createElement('main'))
  const fieldId = createState(7)
  const explicitId = createState(['explicit', 'input'])
  const dispose = render(
    () => (
      <>
        <FormField id={fieldId}>
          <Label>关联字段</Label>
          <Input />
          <Input id={explicitId} />
        </FormField>
        <Input />
        <Checkbox id={[42, 'choice']} checked={false} label="选项" />
      </>
    ),
    host,
  )
  try {
    const field = host.querySelector('.FormField')!
    const inputs = field.querySelectorAll('input')
    const label = field.querySelector('label')!
    expect(inputs[0]!.id).toBe('7')
    expect(label.htmlFor).toBe('7')
    expect(inputs[1]!.id).toBe('explicit,input')
    fieldId.set(9)
    explicitId.set(['next', 'input'])
    flush()
    expect(field.querySelector('input')).toBe(inputs[0])
    expect(inputs[0]!.id).toBe('9')
    expect(label.htmlFor).toBe('9')
    expect(inputs[1]!.id).toBe('next,input')
    expect(host.querySelectorAll('[id="9"]')).toHaveLength(1)
    expect(host.children[1]!.hasAttribute('id')).toBe(false)
    const checkbox = host.querySelector('.Checkbox')!
    expect(checkbox.querySelector('input')!.id).toBe('42,choice')
    expect(checkbox.querySelector('label')!.htmlFor).toBe('42,choice')
  } finally {
    dispose()
    host.remove()
  }
})

test('FormField普通children接受公共控制更新，根与字段身份不重建', () => {
  const host = document.body.appendChild(document.createElement('main'))
  let field!: FormFieldController
  const dispose = render(
    () => (
      <FormField
        id="stable-field"
        ref={(current) => {
          field = current
        }}
      >
        原内容
      </FormField>
    ),
    host,
  )
  try {
    const root = host.querySelector('.FormField')!
    field.props.children.set('新内容')
    flush()
    expect(host.querySelector('.FormField')).toBe(root)
    expect(root.textContent).toBe('新内容')
    expect(field.props.id.read()).toBe('stable-field')
  } finally {
    dispose()
    host.remove()
  }
})
