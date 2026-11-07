/**
 * Piv structure plugin 的本地 Example。
 * 它只服务本地 HTML 验证，不参与组件库正式导出。
 * 这里用可运行示例展示 insertBefore、appendChild、wrapOutside 和元素接入回调的使用边界。
 */
import { Loading, val } from '@/foundation'
import { Piv } from './Piv'
import { Card } from '../kits/Card/Card'
import { Article } from '../kits/Article/Article'
import { createPivStructure } from './plugin/helpers'
import { defineInactivePlugin } from '@/components/plugins/tools/defineInactivePlugin'

const beforeLabelPlugin = defineInactivePlugin({
  name: 'beforeLabel',
  pluginCore({ domProxy }) {
    const { insertBefore } = createPivStructure(domProxy)
    insertBefore(<Piv class="structure-tag">insertBefore 插入</Piv>)
    return {}
  },
})

const appendRedDotPlugin = defineInactivePlugin({
  name: 'appendRedDot',
  pluginCore({ domProxy }) {
    const { appendChild } = createPivStructure(domProxy)
    appendChild(
      <Piv
        as="span"
        class="structure-red-dot"
        htmlProps={{ 'aria-hidden': 'true' }}
      />,
    )
    return {}
  },
})

const wrapManagerPlugin = defineInactivePlugin({
  name: 'wrapManager',
  pluginCore({ domProxy }) {
    const { wrapOutside } = createPivStructure(domProxy)
    wrapOutside(<Piv class="structure-manager" />)
    return {}
  },
})

const selfMeasurePlugin = defineInactivePlugin({
  name: 'selfMeasure',
  pluginCore({ domProxy }) {
    const { insertAfter } = createPivStructure(domProxy)
    insertAfter(
      <Piv class="structure-note">
        domProxy 适合读取当前 DOM 信息：
        <Loading>{val(domProxy).tagName.toLowerCase()}</Loading>
      </Piv>,
    )
    return {}
  },
})

export function PivStructureExample() {
  const beforeLabel = beforeLabelPlugin()
  const appendRedDot = appendRedDotPlugin()
  const wrapManager = wrapManagerPlugin()
  const selfMeasure = selfMeasurePlugin()
  return (
    <Card class="example-card">
      <Article>
        <div class="example-card-head">
          <span>BasicPiv</span>
          <h2>Structure plugin</h2>
        </div>

        <div class="example-stack">
          <Piv class="structure-case" is={beforeLabel}>
            before 用于在主体前方挂辅助标记。
          </Piv>

          <Piv as="button" class="structure-button" is={appendRedDot}>
            appendChild 红点
          </Piv>

          <Piv class="structure-editor" is={wrapManager}>
            <Piv class="structure-editor-title">wrap 管理器</Piv>
            <Piv class="structure-editor-body">
              主体仍然是这个 Piv，外层由插件接管布局边界。
            </Piv>
          </Piv>

          <Piv class="structure-case" is={selfMeasure}>
            element 参数用在插件需要读取当前 DOM 或继续组合端点 API 时。
          </Piv>
        </div>
      </Article>
    </Card>
  )
}
