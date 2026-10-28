/**
 * TextArea 的多行编辑示例。
 *
 * 通过 Field 关联标题，输入后显示当前字数。
 *
 * 让使用者验证控件值的持续更新和独立字段组织。
 */
import { Field, Flow, Text, TextArea } from '@/components'
import { createState } from '@/foundation'
/**
 * 编辑多行内容并显示当前字数。
 */
export function TextAreaExample() {
  const text = createState('')
  return (
    <Flow>
      <Field label="检查依据">
        {(id) => (
          <TextArea
            id={id}
            value={text}
            placeholder="说明检查了什么，以及得到的结果。"
            onInput={(value) => {
              text.set(value)
            }}
          />
        )}
      </Field>
      <Text>{text.map((value) => '已输入 ' + value.length + ' 个字符')}</Text>
    </Flow>
  )
}
