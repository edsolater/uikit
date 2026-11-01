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
      <Text p>合成列可读取整行；紧凑表格保留提示、列宽和比例着色。</Text>
      <Table
        compact
        data={[
          { name: '接口整理', detail: { owner: '小林' }, completion: 1 },
          { name: '示例校验', detail: { owner: '小陈' }, completion: 0.5 },
        ]}
        keys={['summary', 'completion']}
        columnMinWidths={{ summary: 240 }}
        cellTitle={{ summary: (row) => row.detail.owner }}
        cellIntensity={{ completion: (row) => row.completion }}
        renderParts={{
          tableHead: {
            summary: () => '任务与负责人',
            completion: () => '完成比例',
          },
          tableCell: {
            summary: (_value, _key, row, index) =>
              `${index + 1}. ${row.name} · ${row.detail.owner}`,
            completion: (value) => `${value * 100}%`,
          },
        }}
      />
    </Flow>
  )
}
