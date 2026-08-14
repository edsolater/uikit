/** Scope Example：同一 Scope 内允许 Drag and Drop，跨 Scope 时拒绝。 */
import { createSignal } from 'solid-js'
import { Piv } from '../../../Piv'
import '../../DragAndDrop.example.css'
import { dragAndDrop } from '../dragAndDrop'
import { draggable } from '../draggable'
import { droppable } from '../droppable'
import { scope } from './scope'

export function ScopeExample() {
  const [results, setResults] = createSignal<Record<string, string>>({})

  const renderScope = (name: string) => (
    <Piv
      plugin={scope({ capabilities: [dragAndDrop] })}
      class="scope-example-boundary"
    >
      <strong>Scope {name}</strong>
      <Piv
        plugin={draggable({ payload: `${name} payload` })}
        class="drag-drop-example-card"
      >
        拖动 {name}
      </Piv>
      <Piv
        plugin={droppable({
          onDrop: ({ payload }) => setResults((current) => ({
            ...current,
            [name]: `${name} 接收到 ${String(payload)}`,
          })),
        })}
        class="drag-drop-example-target"
        htmlProps={results()[name] ? { 'data-drop-received': 'true' } : {}}
      >
        <span class="drag-drop-example-target-label">放入 Scope {name}</span>
        <output class="drag-drop-example-target-result" aria-live="polite">
          {results()[name] ?? '等待同范围材料'}
        </output>
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

      <div class="drag-drop-example-grid">
        {renderScope('A')}
        {renderScope('B')}
      </div>
    </article>
  )
}
