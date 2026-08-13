/**
 * Input 的 Storybook 示例。
 * 这里只覆盖当前稳定公开形态，不把实验 props 写成组件契约。
 */
import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { Input } from './Input'

const meta: Meta<typeof Input> = {
  title: 'Components/Input',
  component: Input,
  args: {
    htmlProps: {
      placeholder: 'Type something',
    },
  },
}

export default meta

export const Basic: StoryObj<typeof meta> = {}

export const Invalid: StoryObj<typeof meta> = {
  args: {
    invalid: true,
    htmlProps: {
      value: 'invalid value',
    },
  },
}
