/**
 * Droppable Example。
 * 内置拖动源只负责配合验收；draggable 的独立用法见 ../draggable/draggable.example.tsx。
 */
import { createState, val } from '@/foundation'
import { Piv } from '@/components/Piv/Piv'
import { Card } from '@/components/kits/Card/Card'
import { Article } from '@/components/kits/Article/Article'
import '@/components/plugins/kits/dragAndDrop/dragAndDrop.example.style'
import { dragAndDrop } from '@/components/plugins/kits/dragAndDrop/dragAndDrop'
import { droppable as createDroppable } from '@/components/plugins/kits/dragAndDrop/droppable/droppable'

export function DroppableExample() {
  const payloadResult = createState<string>()
  const fileResult = createState<string>()

  const { plugins: { draggable, droppable } } = dragAndDrop({
    draggable: { payload: { widget: 'weather' } },
    droppable: {
      accepts: ({ kind }) => kind === 'internal',
      onDrop: ({ payload }) => payloadResult.set(JSON.stringify(payload)),
    },
  })
  const fileDroppable = createDroppable({
    accepts: ({ kind, files }) => kind === 'external' && files.length > 0,
    dropEffect: 'copy',
    onDrop: ({ files }) => {
      fileResult.set(
        files.length > 0
          ? files.map((file) => file.name).join('、')
          : '浏览器没有公开文件名',
      )
    },
  })

  return (
    <Card class="example-card">
      <Article>
        <div class="example-card-head">
          <span>Plugin</span>
          <h2>Droppable</h2>
        </div>
        <p>第一个接收端与 draggable 配合；第二个接收端独立接收系统外部文件。</p>

        <div class="drag-drop-example-grid">
          <div class="drag-drop-example-stack">
            <Piv is={draggable} class="drag-drop-example-card">
              拖动 Widget payload
            </Piv>
            <Piv
              is={droppable}
              class="drag-drop-example-target"
              htmlProps={
                val(payloadResult) ? { 'data-drop-received': 'true' } : {}
              }
            >
              <span class="drag-drop-example-target-label">
                接收 UIKit payload
              </span>
              <output class="drag-drop-example-target-result" aria-live="polite">
                {val(payloadResult)
                  ? `已接收：${val(payloadResult)}`
                  : '等待放下'}
              </output>
            </Piv>
          </div>

          <div class="drag-drop-example-stack">
            <Piv
              is={fileDroppable}
              class="drag-drop-example-target"
              htmlProps={val(fileResult) ? { 'data-drop-received': 'true' } : {}}
            >
              <span class="drag-drop-example-target-label">
                把系统文件拖到这里
              </span>
              <output class="drag-drop-example-target-result" aria-live="polite">
                {val(fileResult)
                  ? `已接收：${val(fileResult)}`
                  : '可以从桌面或文件管理器拖入文件'}
              </output>
            </Piv>
          </div>
        </div>
      </Article>
    </Card>
  )
}
