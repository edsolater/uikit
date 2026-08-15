/** Card 的 Storybook 示例覆盖稳定公开声量与尺寸档位。 */
import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { Card } from './Card'

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  args: {
    children: 'Card 承载属于同一个信息单元的内容。',
  },
}

export default meta

export const Normal: StoryObj<typeof meta> = {}

export const Soft: StoryObj<typeof meta> = {
  args: { tone: 'soft' },
}

export const Solid: StoryObj<typeof meta> = {
  args: { tone: 'solid' },
}

export const Small: StoryObj<typeof meta> = {
  args: { size: 'small' },
}

export const Large: StoryObj<typeof meta> = {
  args: { size: 'large' },
}

export const XLarge: StoryObj<typeof meta> = {
  args: { size: 'xlarge' },
}
