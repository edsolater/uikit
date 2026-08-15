/**
 * Popover 的 Storybook 示例。
 * 这里只覆盖当前稳定公开形态，不把实验交互协议写成组件契约。
 */
import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { Popover } from './Popover'

const meta: Meta<typeof Popover> = {
  title: 'Components/Popover',
  component: Popover,
  args: {
    trigger: '查看说明',
    title: '最新 Chrome 原生能力',
    children: (
      <>
        <p>这个 Popover 使用原生 Popover API 打开与关闭。</p>
        <p>定位使用 CSS anchor positioning，箭头边框使用 border-shape。</p>
      </>
    ),
  },
}

export default meta

export const Bottom: StoryObj<typeof meta> = {}

export const Top: StoryObj<typeof meta> = {
  args: {
    top: true,
    trigger: '上方弹出',
  },
}

export const Right: StoryObj<typeof meta> = {
  args: {
    right: true,
    trigger: '右侧弹出',
  },
}