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
      <p>按钮只表达视觉形态、动作语气和交互尺寸，不承载导航语义。</p>

      <div class="button-example-grid">
        <div class="button-example-head">类型</div>
        <div class="button-example-head">默认</div>
        <div class="button-example-head">悬停</div>
        <div class="button-example-head">按下</div>
        <div class="button-example-head">流程</div>

        <div class="button-example-label">普通</div>
        <div><Button>Default</Button></div>
        <div class="button-example-state-hover"><Button>Default</Button></div>
        <div class="button-example-state-active"><Button>Default</Button></div>
        <div class="button-row">
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
        </div>

        <div class="button-example-label">主操作</div>
        <div><Button solid>Solid</Button></div>
        <div class="button-example-state-hover"><Button solid>Solid</Button></div>
        <div class="button-example-state-active"><Button solid>Solid</Button></div>
        <div class="button-row">
          <Button solid loading>Loading</Button>
          <Button solid disabled>Disabled</Button>
        </div>

        <div class="button-example-label">推荐</div>
        <div><Button accent solid>Accent</Button></div>
        <div class="button-example-state-hover"><Button accent solid>Accent</Button></div>
        <div class="button-example-state-active"><Button accent solid>Accent</Button></div>
        <div class="button-row">
          <Button accent solid loading>Loading</Button>
          <Button accent solid disabled>Disabled</Button>
        </div>

        <div class="button-example-label">危险</div>
        <div><Button danger solid>Danger</Button></div>
        <div class="button-example-state-hover"><Button danger solid>Danger</Button></div>
        <div class="button-example-state-active"><Button danger solid>Danger</Button></div>
        <div class="button-row">
          <Button danger solid loading>Loading</Button>
          <Button danger solid disabled>Disabled</Button>
        </div>

        <div class="button-example-label">退场</div>
        <div><Button bare>Bare</Button></div>
        <div class="button-example-state-hover"><Button bare>Bare</Button></div>
        <div class="button-example-state-active"><Button bare>Bare</Button></div>
        <div class="button-row">
          <Button bare loading>Loading</Button>
          <Button bare disabled>Disabled</Button>
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
          <Button small solid>Small</Button>
          <Button solid>Medium</Button>
          <Button large solid>Large</Button>
          <Button xlarge solid>XLarge</Button>
        </div>
      </div>
    </Article>
  )
}
