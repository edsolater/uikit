import type { Preview } from 'storybook-solidjs-vite'
import '../src/css/all-base.css'
import '@/components/kits/Button/Button.style'
import { cssRoot } from '@/style-system'

// 基础 CSS 先建立 layer 顺序，再让静态样式宿主接收组件声明。
document.head.append(document.querySelector<HTMLStyleElement>('style#css-root')!)
cssRoot.mount()

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
      },
    },
    layout: 'centered',
  },
}

export default preview
