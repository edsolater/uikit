/**
 * Card 的本地 Example：验证独立信息单元的默认形态、声量和尺寸。
 *
 * 组合独立正文和承载外观，按阅读顺序组织标题与说明。
 *
 * 示例保留各组件自己的语义和样式边界。
 */
import { Card } from '../Card'
import { Article } from '../../Article/Article'
import { Flow } from '../../Flow/Flow'
import { clickable } from '../../../plugins/kits/clickable/clickable'
import './appearance-and-size.style'

/**
 * 呈现正文与信息卡片，供比较各自的语义和默认外观。
 */
export function AppearanceAndSizeExample() {
  const cardClickable = clickable()
  return (
    <Card class="example-card">
      <Article>
        <Flow $col>
          <div class="example-card-head">
            <span>组件</span>
            <h2>Card</h2>
          </div>
          <p>
            省略属性即可得到完整信息卡片；variant 调整视觉声量，size
            调整内部容纳尺度。
          </p>

          <div class="card-example-grid">
            <Card class="card-example-item" small is={cardClickable}>
              <Flow $col>
                <strong>紧凑</strong>
                <span>紧凑信息单元</span>
              </Flow>
            </Card>
            <Card class="card-example-item">
              <Flow $col>
                <strong>默认</strong>
                <span>普通信息单元</span>
              </Flow>
            </Card>
            <Card class="card-example-item" large>
              <Flow $col>
                <strong>宽松</strong>
                <span>宽松信息单元</span>
              </Flow>
            </Card>
            <Card class="card-example-item" xlarge>
              <Flow $col>
                <strong>大尺寸</strong>
                <span>大尺寸信息单元</span>
              </Flow>
            </Card>
            <Card class="card-example-item" soft>
              <Flow $col>
                <strong>柔和</strong>
                <span>低声量辅助卡片</span>
              </Flow>
            </Card>
            <Card class="card-example-item" solid>
              <Flow $col>
                <strong>实体</strong>
                <span>稳定对比的实体卡片</span>
              </Flow>
            </Card>
          </div>
        </Flow>
      </Article>
    </Card>
  )
}
