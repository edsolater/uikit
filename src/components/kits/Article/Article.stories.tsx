/** Article 的 Storybook 示例验证正文语义可以由 Card 透明承载。 */
import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { Card } from '../Card'
import { Article } from './Article'

const meta: Meta<typeof Article> = {
  title: 'Components/Article',
  component: Article,
}

export default meta

export const Native: StoryObj<typeof meta> = {
  args: {
    children: '原生 Article 正文。',
  },
}

export const WithCard: StoryObj<typeof meta> = {
  render: () => (
    <Article as={Card}>
      <h2>由 Card 承载的 Article</h2>
      <p>最终只有一个原生 article 节点。</p>
    </Article>
  ),
}
