/**
 * Checkbox 的完整勾选项示例。
 *
 * 让标题和勾选框共同切换状态，并显示确认结果。
 *
 * 让使用者验证选项的点击范围和状态反馈。
 */
import { Checkbox, Flow, Text } from '@/components'
import { createState } from '@/foundation'
/**
 * 切换确认选项并显示确认状态。
 */
export function CheckboxExample() {
  const checked = createState(false)
  return (
    <Flow>
      <Checkbox
        label="已核对原始资料"
        tooltip="核对完成后勾选；标题与方框属于同一个选项。"
        checked={checked}
        onChange={(value) => {
          checked.set(value)
        }}
      />
      <Text>
        {checked.map((value) => (value ? '核对已确认' : '等待确认核对结果'))}
      </Text>
    </Flow>
  )
}
