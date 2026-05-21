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
      <p>Input 只负责输入框本体；label 和错误文案编排放到更上层组件。</p>
      <div class="input-row">
        <Input htmlProps={{ placeholder: '默认输入框', value: 'solid input' }} />
        <Input variant="ghost" htmlProps={{ placeholder: 'Ghost 输入框' }} />
        <Input invalid htmlProps={{ placeholder: 'Invalid 输入框', value: 'invalid value' }} />
      </div>
    </article>
  )
}
