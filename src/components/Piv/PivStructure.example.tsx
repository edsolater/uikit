/**
 * Piv structure plugin 的本地 Example。
 * 它只服务本地 HTML 验证，不参与组件库正式导出。
 * 这里用可运行示例展示 insertBefore、appendChild、wrapOutside 和 element 参数的使用边界。
 */
import { Piv } from './Piv'
import { createPivPlugin } from './plugin/helpers'

const beforeLabelPlugin = createPivPlugin(({ insertBefore }) => {
  insertBefore(<Piv class="structure-tag">insertBefore 插入</Piv>)
})

const appendRedDotPlugin = createPivPlugin(({ appendChild }) => {
  appendChild(<Piv as="span" class="structure-red-dot" htmlProps={{ 'aria-hidden': 'true' }} />)
})

const wrapManagerPlugin = createPivPlugin(({ wrapOutside }) => {
  wrapOutside(<Piv class="structure-manager" />)
})

const selfMeasurePlugin = createPivPlugin(({ element, insertAfter }) => {
  insertAfter(
    <Piv class="structure-note">
      element 参数适合读取当前 DOM 信息：{element.tagName.toLowerCase()}
    </Piv>,
  )
})

export function PivStructureExample() {
  return (
    <article class="panel">
      <div class="panel-head">
        <span>BasicPiv</span>
        <h2>Structure plugin</h2>
      </div>

      <div class="example-stack">
        <Piv class="structure-case" plugins={beforeLabelPlugin}>
          before 用于在主体前方挂辅助标记。
        </Piv>

        <Piv as="button" class="structure-button" plugins={appendRedDotPlugin}>
          appendChild 红点
        </Piv>

        <Piv class="structure-editor" plugins={wrapManagerPlugin}>
          <Piv class="structure-editor-title">wrap 管理器</Piv>
          <Piv class="structure-editor-body">主体仍然是这个 Piv，外层由插件接管布局边界。</Piv>
        </Piv>

        <Piv class="structure-case" plugins={selfMeasurePlugin}>
          element 参数用在插件需要读取当前 DOM 或继续组合端点 API 时。
        </Piv>
      </div>
    </article>
  )
}
