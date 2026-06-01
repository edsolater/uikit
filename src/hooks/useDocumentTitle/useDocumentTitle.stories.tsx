/**
 * useDocumentTitle 的 Storybook 示例。
 * 这里验证浏览器标题同步行为，不扩展 hook 职责。
 */
import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { Button } from '../../components/Button'
import { createState, val } from '../createState'
import { useDocumentTitle } from './useDocumentTitle'

function UseDocumentTitlePreview() {
  const samples = ['Storybook Title', 'Hook State Title', 'Solid Kit Preview']
  const index = createState(0)
  const title = useDocumentTitle(() => samples[val(index)])

  return (
    <div style={{ display: 'grid', gap: '16px', 'max-width': '320px' }}>
      <strong>{title()}</strong>
      <Button tone="soft" onClick={() => {
        index.set((value) => (value + 1) % samples.length)
      }}>
        Switch title
      </Button>
    </div>
  )
}

const meta: Meta<typeof UseDocumentTitlePreview> = {
  title: 'Hooks/useDocumentTitle',
  component: UseDocumentTitlePreview,
}

export default meta

export const Basic: StoryObj<typeof meta> = {}