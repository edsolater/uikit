import type { Preview } from 'storybook-solidjs-vite'
import '../src/css/all-base.css'
import '@/components/kits/Button/Button.style'
import { cssRoot } from '@/style-system'

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
