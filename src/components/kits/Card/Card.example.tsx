/** Card 的本地 Example：验证独立信息单元的默认形态、声量和尺寸。 */
import { Card } from './Card'
import { Article } from '../Article/Article'
import { Flow } from '../Flow/Flow'
import './Card.example.css'

export function CardExample() {
  return (
    <Card class="example-card">
      <Article>
        <Flow>
          <div class="example-card-head">
            <span>Component</span>
            <h2>Card</h2>
          </div>
          <p>
            省略属性即可得到完整信息卡片；variant 调整视觉声量，size
            调整内部容纳尺度。
          </p>

          <div class="card-example-grid">
            <Card class="card-example-item" small>
              <Flow>
                <strong>Small</strong>
                <span>紧凑信息单元</span>
              </Flow>
            </Card>
            <Card class="card-example-item">
              <Flow>
                <strong>Default</strong>
                <span>普通信息单元</span>
              </Flow>
            </Card>
            <Card class="card-example-item" large>
              <Flow>
                <strong>Large</strong>
                <span>宽松信息单元</span>
              </Flow>
            </Card>
            <Card class="card-example-item" xlarge>
              <Flow>
                <strong>XLarge</strong>
                <span>大尺寸信息单元</span>
              </Flow>
            </Card>
            <Card class="card-example-item" soft>
              <Flow>
                <strong>Soft</strong>
                <span>低声量辅助卡片</span>
              </Flow>
            </Card>
            <Card class="card-example-item" solid>
              <Flow>
                <strong>Solid</strong>
                <span>稳定对比的实体卡片</span>
              </Flow>
            </Card>
          </div>
        </Flow>
      </Article>
    </Card>
  )
}
