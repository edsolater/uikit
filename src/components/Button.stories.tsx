import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  args: {
    children: 'Button',
  },
}

export default meta

export const Solid: StoryObj<typeof meta> = {}

export const Ghost: StoryObj<typeof meta> = {
  args: {
    variant: 'ghost',
    children: 'Ghost button',
  },
}

export const Disabled: StoryObj<typeof meta> = {
  args: {
    disabled: true,
    children: 'Disabled button',
  },
}