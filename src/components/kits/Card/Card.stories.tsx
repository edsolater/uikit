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
  args: { soft: true },
}

export const Solid: StoryObj<typeof meta> = {
  args: { solid: true },
}

export const Small: StoryObj<typeof meta> = {
  args: { small: true },
}

export const Large: StoryObj<typeof meta> = {
  args: { large: true },
}

export const XLarge: StoryObj<typeof meta> = {
  args: { xlarge: true },
}
