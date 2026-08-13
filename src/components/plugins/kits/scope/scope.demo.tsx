/** Scope 的本地 Demo：同一 Scope 内允许 Drag and Drop，跨 Scope 时拒绝。 */
import { createSignal } from 'solid-js'
import { Piv } from '../../../Piv'
import '../../DragAndDrop.demo.css'
import { dragAndDrop } from '../dragAndDrop'
import { draggable } from '../draggable'
import { droppable } from '../droppable'
import { scope } from './scope'

export function ScopeDemo() {
  const [result, setResult] = createSignal('尝试同范围与跨范围拖动')

  const renderScope = (name: string) => (
    <Piv
      plugin={scope({ capabilities: [dragAndDrop] })}
      class="scope-demo-boundary"
    >
      <strong>Scope {name}</strong>
      <Piv
        plugin={draggable({ payload: `${name} payload` })}
        class="drag-drop-demo-card"
      >
        拖动 {name}
      </Piv>
      <Piv
        plugin={droppable({
          onDrop: ({ payload }) => setResult(`${name} 接收到 ${String(payload)}`),
        })}
        class="drag-drop-demo-target"
      >
        放入 Scope {name}
      </Piv>
    </Piv>
  )

  return (
    <article class="panel">
      <div class="panel-head">
        <span>Plugin</span>
        <h2>Scope + Drag and Drop</h2>
      </div>
      <p>同一边界内显示绿色并允许放下；从 A 拖到 B 时显示拒绝状态且不触发 onDrop。</p>

      <div class="drag-drop-demo-grid">
        {renderScope('A')}
        {renderScope('B')}
      </div>

      <p class="drag-drop-demo-result">{result()}</p>
    </article>
  )
}
