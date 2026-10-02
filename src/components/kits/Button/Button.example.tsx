/**
 * Button 的本地 Example。
 * 它只服务本地 HTML 验证，不参与组件库正式导出。
 */
import { Button } from './Button'
import { Card } from '../Card'
import { Article } from '../Article'

export function ButtonExample() {
  return (
    <Article as={Card} class="example-card">
      <div class="example-card-head">
        <span>Component</span>
        <h2>Button</h2>
      </div>
      <p>按钮分别描述外观、强调程度、动作语气和尺寸，不承载导航语义。新外观与强调字段的样式尚待设计。</p>

      <div class="button-example-grid">
        <div class="button-example-head">类型</div>
        <div class="button-example-head">默认</div>
        <div class="button-example-head">悬停体验</div>
        <div class="button-example-head">按下体验</div>
        <div class="button-example-head">流程</div>

        <div class="button-example-label">普通</div>
        <div><Button>Default</Button></div>
        <div><Button>Default</Button></div>
        <div><Button>Default</Button></div>
        <div class="button-row">
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
        </div>

        <div class="button-example-label">filled 外观</div>
        <div><Button filled>Filled</Button></div>
        <div><Button filled>Filled</Button></div>
        <div><Button filled>Filled</Button></div>
        <div class="button-row">
          <Button filled loading>Loading</Button>
          <Button filled disabled>Disabled</Button>
        </div>

        <div class="button-example-label">较强强调</div>
        <div><Button strong filled>强调</Button></div>
        <div><Button strong filled>强调</Button></div>
        <div><Button strong filled>强调</Button></div>
        <div class="button-row">
          <Button strong filled loading>处理中</Button>
          <Button strong filled disabled>禁用</Button>
        </div>

        <div class="button-example-label">危险</div>
        <div><Button danger filled>Danger</Button></div>
        <div><Button danger filled>Danger</Button></div>
        <div><Button danger filled>Danger</Button></div>
        <div class="button-row">
          <Button danger filled loading>Loading</Button>
          <Button danger filled disabled>Disabled</Button>
        </div>

        <div class="button-example-label">plain 外观</div>
        <div><Button plain>Plain</Button></div>
        <div><Button plain>Plain</Button></div>
        <div><Button plain>Plain</Button></div>
        <div class="button-row">
          <Button plain loading>Loading</Button>
          <Button plain disabled>Disabled</Button>
        </div>
      </div>

      <div class="button-size-stack">
        <div class="button-example-label">尺寸</div>
        <div class="button-row">
          <Button small>Small</Button>
          <Button>Medium</Button>
          <Button large>Large</Button>
          <Button xlarge>XLarge</Button>
        </div>
        <div class="button-row">
          <Button small filled>Small</Button>
          <Button filled>Medium</Button>
          <Button large filled>Large</Button>
          <Button xlarge filled>XLarge</Button>
        </div>
      </div>
    </Article>
  )
}
