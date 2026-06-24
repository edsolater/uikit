/**
 * Button 的 Storybook 示例。
 * 这里只覆盖当前稳定公开形态，不把实验 props 写成组件契约。
 */
import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { Button } from './Button'

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  args: {
    children: 'Button',
  },
}

export default meta

export const Normal: StoryObj<typeof meta> = {}

export const Solid: StoryObj<typeof meta> = {
  args: {
    tone: 'solid',
    intent: 'accent',
    children: 'Save',
  },
}

export const Bare: StoryObj<typeof meta> = {
  args: {
    tone: 'bare',
    children: 'Clear',
  },
}

export const BareDanger: StoryObj<typeof meta> = {
  args: {
    tone: 'bare',
    intent: 'danger',
    children: 'Remove',
  },
}

export const Disabled: StoryObj<typeof meta> = {
  args: {
    status: 'disabled',
    children: 'Disabled button',
  },
}
