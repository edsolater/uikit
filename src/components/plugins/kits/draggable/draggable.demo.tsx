/** Draggable 的本地 Demo：验证原始元素移动不依赖 Droppable。 */
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
      <p>拖动卡片时，原始元素在 Top Layer 跟随指针；原位置只留下参与布局、没有内容和状态的几何轮廓。</p>

      <Piv
        plugin={draggable({ payload: 'Weather payload' })}
        class="drag-drop-demo-card"
      >
        拖动 Weather
      </Piv>
    </article>
  )
}
