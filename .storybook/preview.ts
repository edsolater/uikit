import type { Preview } from 'storybook-solidjs-vite'
import '../src/css/all-base.css'
import '../src/components/kits/Button/Button.style'
import { cssRoot } from '../src/style-system'

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
