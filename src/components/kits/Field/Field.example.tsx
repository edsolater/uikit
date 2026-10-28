/**
 * Field 的字段关联示例。
 *
 * 给两个独立输入提供同名标题和各自的关联身份。
 *
 * 让使用者验证标题点击不会聚焦到另一项字段。
 */
import { Field, Flow, Input, Text } from '@/components'
/**
 * 展示两个同名字段各自独立的标题关联。
 */
export function FieldExample() {
  return (
    <Flow>
      <Text>点击任意“联系人”标题，会聚焦它对应的输入框。</Text>
      <Field label="联系人">
        {(id) => <Input id={id} htmlProps={{ placeholder: '项目负责人' }} />}
      </Field>
      <Field label="联系人">
        {(id) => <Input id={id} htmlProps={{ placeholder: '独立审查者' }} />}
      </Field>
    </Flow>
  )
}
