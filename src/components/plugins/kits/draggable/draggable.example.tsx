/** Draggable Example：验证原始元素移动不依赖 Droppable。 */
import { Piv } from '../../../Piv'
import { Card } from '../../../kits/Card'
import { Article } from '../../../kits/Article'
import '../../DragAndDrop.example.css'
import { draggable } from './draggable'

export function DraggableExample() {
  return (
    <Article as={Card} class="example-card">
      <div class="example-card-head">
        <span>Plugin</span>
        <h2>Draggable</h2>
      </div>
      <p>拖动卡片时，原始元素在 Top Layer 跟随指针；原位置只留下参与布局、没有内容和状态的几何轮廓。</p>

      <Piv
        plugin={draggable({ payload: 'Weather payload' })}
        class="drag-drop-example-card"
      >
        拖动 Weather
      </Piv>
    </Article>
  )
}
