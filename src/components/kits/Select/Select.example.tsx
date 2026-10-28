/**
 * Select 的有限选项示例。
 *
 * 选择工作阶段，并显示对应的业务读数。
 *
 * 让使用者验证选择结果，而非只看到静态控件。
 */
import { Field, Flow, Select, Text } from '@/components'
import { createState } from '@/foundation'
/**
 * 选择工作阶段并显示当前结果。
 */
export function SelectExample() {
  const value = createState('pending')
  const labels: Record<string, string> = {
    pending: '待开始',
    running: '进行中',
    done: '已完成',
  }
  return (
    <Flow>
      <Field label="工作阶段">
        {(id) => (
          <Select
            id={id}
            value={value}
            options={[
              { value: 'pending', label: '待开始' },
              { value: 'running', label: '进行中' },
              { value: 'done', label: '已完成' },
            ]}
            onChange={(next) => {
              value.set(next)
            }}
          />
        )}
      </Field>
      <Text>{value.map((current) => '当前阶段：' + labels[current])}</Text>
    </Flow>
  )
}
