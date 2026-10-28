/**
 * 项目记录表格示例。
 *
 * 展示对象字段到表头、记录到数据行的对应关系。
 *
 * 帮助使用者在保留原生表格语义时自定义内容。
 */
import { Flow, Heading, Table, Text } from '@/components'

/**
 * 按名称、负责人和进度展示项目记录，并将字段名转换为中文表头。
 */
export function TableExample() {
  return (
    <Flow>
      <Heading level={2}>Table · 项目进度</Heading>
      <Text p>每行是一项记录，列顺序由 keys 明确指定。</Text>
      <Table
        data={[
          { name: '组件示例', owner: '小林', progress: '已完成' },
          { name: '使用指南', owner: '小陈', progress: '审核中' },
          { name: '发布准备', owner: '小周', progress: '待开始' },
        ]}
        keys={['name', 'owner', 'progress']}
        renderParts={{
          tableHead: {
            name: () => '项目',
            owner: () => '负责人',
            progress: () => '进度',
          },
        }}
      />
    </Flow>
  )
}
