/** Drag and Drop Example：同一次组合共享内部身份，不同组拒绝。 */
import { createState, val } from '@/foundation'
import { Piv } from '@/components/Piv/Piv'
import { Card } from '@/components/kits/Card/Card'
import { Article } from '@/components/kits/Article/Article'
import './dragAndDrop.example.style'
import { dragAndDrop } from '@/components/plugins/kits/dragAndDrop/dragAndDrop'

type ExampleGroup = ReturnType<typeof dragAndDrop>

/**
 * 展示两组相互独立的拖放；只有同组接收后更新结果。
 */
export function DragAndDropExample() {
  const results = createState<Record<string, string>>({})

  const groupA = dragAndDrop({
    draggable: { payload: 'A payload' },
    droppable: {
      onDrop: ({ payload }) =>
        results.set((current) => ({
          ...current,
          A: `A 接收到 ${String(payload)}`,
        })),
    },
  })
  const groupB = dragAndDrop({
    draggable: { payload: 'B payload' },
    droppable: {
      onDrop: ({ payload }) =>
        results.set((current) => ({
          ...current,
          B: `B 接收到 ${String(payload)}`,
        })),
    },
  })

  /**
   * 呈现一组拖动源、接收区及其结果。
   */
  const renderGroup = (name: 'A' | 'B', group: ExampleGroup) => (
    <Piv class="drag-drop-example-group">
      <strong>组 {name}</strong>
      <Piv is={group.plugins.draggable} class="drag-drop-example-card">
        拖动 {name}
      </Piv>
      <Piv
        is={group.plugins.droppable}
        class="drag-drop-example-target"
        htmlProps={val(results)[name] ? { 'data-drop-received': 'true' } : {}}
      >
        <span class="drag-drop-example-target-label">放入 组 {name}</span>
        <output class="drag-drop-example-target-result" aria-live="polite">
          {val(results)[name] ?? '等待同组材料'}
        </output>
      </Piv>
    </Piv>
  )

  return (
    <Card class="example-card">
      <Article>
        <div class="example-card-head">
          <span>Plugin</span>
          <h2>Drag and Drop 分组</h2>
        </div>
        <p>
          同组显示绿色并允许放下；从 A 拖到 B 时显示拒绝状态且不触发 onDrop。
        </p>

        <div class="drag-drop-example-grid">
          {renderGroup('A', groupA)}
          {renderGroup('B', groupB)}
        </div>
      </Article>
    </Card>
  )
}
