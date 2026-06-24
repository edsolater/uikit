/**
 * Input 的本地 demo。
 * 它只服务本地 HTML 验证，不参与组件库正式导出。
 */
import { Input } from './Input'

export function InputDemo() {
  return (
    <article class="panel">
      <div class="panel-head">
        <span>Component</span>
        <h2>Input</h2>
      </div>
      <p>Input 承载一个单行可编辑值；字段名、说明和错误文案放到更上层组件。</p>
      <div class="input-row">
        <Input htmlProps={{ placeholder: '默认输入框', value: '默认输入值' }} />
        <Input invalid htmlProps={{ placeholder: '无效输入框', value: 'invalid value' }} />
      </div>
    </article>
  )
}
