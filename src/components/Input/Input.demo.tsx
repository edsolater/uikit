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
      <div class="setting-list">
        <div class="setting-row field-row">
          <div class="field-copy">
            <label for="default-input">普通字段</label>
            <span>用于承载一个单行可编辑值。</span>
          </div>
          <Input htmlProps={{ id: 'default-input', placeholder: '默认输入框', value: '默认输入值' }} />
        </div>
        <div class="setting-row field-row">
          <div class="field-copy">
            <label for="invalid-input">错误字段</label>
            <span>当前值无法通过校验时，由上层 Field 组合展示说明。</span>
          </div>
          <Input invalid htmlProps={{ id: 'invalid-input', placeholder: '无效输入框', value: 'invalid value' }} />
          <p class="field-error">请输入合法值。</p>
        </div>
      </div>
    </article>
  )
}
