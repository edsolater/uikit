/** Article 的本地 Example：正文语义由 Article 提供，视觉形式由 Card 提供。 */
import { Card } from '../Card'
import { Article } from './Article'
import './Article.example.css'

export function ArticleExample() {
  return (
    <Article as={Card} class="example-card">
      <div class="example-card-head">
        <span>Component</span>
        <h2>Article</h2>
      </div>
      <p>Article 表达可独立理解的正文；Card 只是这篇正文当前采用的视觉形式。</p>

      <div class="article-example-contract">
        <span>最终节点</span>
        <code>&lt;article class=&quot;Card example-card&quot;&gt;</code>
        <strong>正文语义优先，Card 提供视觉，不增加包裹层。</strong>
      </div>
    </Article>
  )
}
