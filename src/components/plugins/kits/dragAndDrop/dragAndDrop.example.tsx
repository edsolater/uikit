/** Drag and Drop Example：共享 id 的节点协作，不同组拒绝。 */
import { createState, val } from '@/foundation'
import { Piv } from '@/components/Piv/Piv'
import { Card } from '@/components/kits/Card/Card'
import { Article } from '@/components/kits/Article/Article'
import './dragAndDrop.example.style'
import { draggable } from '@/components/plugins/kits/dragAndDrop/draggable/draggable'
import { droppable } from '@/components/plugins/kits/dragAndDrop/droppable/droppable'

export function DragAndDropExample() {
  const results = createState<Record<string, string>>({})

  const idA = {}
  const idB = {}
  const renderGroup = (name: string, id: object) => (
    <Piv class="drag-drop-example-group">
      <strong>组 {name}</strong>
      <Piv
        is={draggable({ id, payload: `${name} payload` })}
        class="drag-drop-example-card"
      >
        拖动 {name}
      </Piv>
      <Piv
        is={droppable({
          id,
          onDrop: ({ payload }) =>
            results.set((current) => ({
              ...current,
              [name]: `${name} 接收到 ${String(payload)}`,
            })),
        })}
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
          {renderGroup('A', idA)}
          {renderGroup('B', idB)}
        </div>
      </Article>
    </Card>
  )
}
