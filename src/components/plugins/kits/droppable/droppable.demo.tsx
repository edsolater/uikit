/**
 * Droppable 的本地 Demo。
 * 内置拖动源只负责配合验收；draggable 的独立用法见 ../draggable/draggable.demo.tsx。
 */
import { createSignal } from 'solid-js'
import { Piv } from '../../../Piv'
import '../../DragAndDrop.demo.css'
import { draggable } from '../draggable'
import { droppable } from './droppable'

export function DroppableDemo() {
  const [payloadResult, setPayloadResult] = createSignal('尚未接收 UIKit payload')
  const [fileResult, setFileResult] = createSignal('可以从桌面或文件管理器拖入文件')

  return (
    <article class="panel">
      <div class="panel-head">
        <span>Plugin</span>
        <h2>Droppable</h2>
      </div>
      <p>第一个接收端与 draggable 配合；第二个接收端独立接收系统外部文件。</p>

      <div class="drag-drop-demo-grid">
        <div class="drag-drop-demo-stack">
          <Piv
            plugin={draggable({ payload: { widget: 'weather' } })}
            class="drag-drop-demo-card"
          >
            拖动 Widget payload
          </Piv>
          <Piv
            plugin={droppable({
              accepts: ({ kind }) => kind === 'internal',
              onDrop: ({ payload }) => setPayloadResult(JSON.stringify(payload)),
            })}
            class="drag-drop-demo-target"
          >
            接收 UIKit payload
          </Piv>
          <p class="drag-drop-demo-result">{payloadResult()}</p>
        </div>

        <div class="drag-drop-demo-stack">
          <Piv
            plugin={droppable({
              accepts: ({ kind, files }) => kind === 'external' && files.length > 0,
              dropEffect: 'copy',
              onDrop: ({ files }) => {
                setFileResult(files.length > 0
                  ? files.map((file) => file.name).join('、')
                  : '浏览器没有公开文件名')
              },
            })}
            class="drag-drop-demo-target"
          >
            把系统文件拖到这里
          </Piv>
          <p class="drag-drop-demo-result">{fileResult()}</p>
        </div>
      </div>
    </article>
  )
}
