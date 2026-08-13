/**
 * 这个文件只负责本地演示页面。
 * 它不参与发布包的正式导出边界，也不承载组件库 API 设计。
 * 本地开发需要快速验证组件和 hook 时，可以在这里组合最小示例。
 */
import { ButtonDemo } from '../../../components/kits/Button/Button.demo'
import { InputDemo } from '../../../components/kits/Input/Input.demo'
import { PivStructureDemo } from '../../../components/Piv/PivStructure.demo'
import { PopoverDemo } from '../../../components/kits/Popover/Popover.demo'
import { DraggableDemo } from '../../../components/plugins/kits/draggable/draggable.demo'
import { DroppableDemo } from '../../../components/plugins/kits/droppable/droppable.demo'
import { ScopeDemo } from '../../../components/plugins/kits/scope/scope.demo'
import { ColorDashboardDemo } from '../../../css/ColorDashboardDemo'
import { UseDocumentTitleDemo } from '../../../hooks/useDocumentTitle/useDocumentTitle.demo'
import './ExampleDashboard.css'

function App() {
  return (
    <main class="demo-shell">
      <ButtonDemo />
      <InputDemo />
      <ColorDashboardDemo />
      <PivStructureDemo />
      <DraggableDemo />
      <DroppableDemo />
      <ScopeDemo />
      <PopoverDemo />
      <UseDocumentTitleDemo />
    </main>
  )
}

export default App
