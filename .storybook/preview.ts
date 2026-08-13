import type { Preview } from 'storybook-solidjs-vite'
import '../src/css/all-base.css'

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
