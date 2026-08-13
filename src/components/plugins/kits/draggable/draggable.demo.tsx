/** Draggable 的本地 Demo：验证 transform 预览不依赖 Droppable。 */
import { Piv } from '../../../Piv'
import '../../DragAndDrop.demo.css'
import { draggable } from './draggable'

export function DraggableDemo() {
  return (
    <article class="panel">
      <div class="panel-head">
        <span>Plugin</span>
        <h2>Draggable</h2>
      </div>
      <p>拖动卡片时，原位置保留占位；不透明副本在页面顶层用 transform 跟随指针并带有阴影。</p>

      <Piv
        plugin={draggable({ payload: 'Weather payload' })}
        class="drag-drop-demo-card"
      >
        拖动 Weather
      </Piv>
    </article>
  )
}
