/**
 * Article 的本地 Example：正文语义由 Article 提供，视觉形式由 Card 提供。
 *
 * 组合独立正文和承载外观，按阅读顺序组织标题与说明。
 *
 * 示例保留各组件自己的语义和样式边界。
 */
import { Card } from '../Card/Card'
import { Article } from './Article'
import { Flow } from '../Flow/Flow'
import './Article.example.style'

/**
 * 呈现正文与信息卡片，供比较各自的语义和默认外观。
 */
export function ArticleExample() {
  return (
    <>
      <Article>
        <h3>原生 Article 正文</h3>
        <p>
          语义组件固定使用
          article，只裁剪首尾块外边距；默认没有背景、内边距或边框。
        </p>
      </Article>
      <Card class="example-card">
        <Article>
          <Flow styleConfig={{ direction: 'column' }}>
            <div class="example-card-head">
              <span>语义组件</span>
              <h2>Article</h2>
            </div>
            <p>
              Card 承载这篇独立正文；内部 Article 声明正文身份，不自带容器皮肤。
            </p>

            <div class="article-example-contract">
              <span>独立边界</span>
              <code>
                &lt;Card&gt;&lt;Article&gt;正文&lt;/Article&gt;&lt;/Card&gt;
              </code>
              <strong>外层 Card 承载正文，内层 Article 声明正文语义。</strong>
            </div>
          </Flow>
        </Article>
      </Card>
    </>
  )
}
