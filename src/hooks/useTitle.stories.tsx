import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { createSignal } from 'solid-js'
import { Button } from '../components/Button'
import { useTitle } from './useTitle'

function UseTitlePreview() {
  const samples = ['Storybook Title', 'Hook State Title', 'Solid Kit Preview']
  const [index, setIndex] = createSignal(0)
  const title = useTitle(() => samples[index()])

  return (
    <div style={{ display: 'grid', gap: '16px', 'max-width': '320px' }}>
      <strong>{title()}</strong>
      <Button variant="ghost" onClick={() => setIndex((index() + 1) % samples.length)}>
        Switch title
      </Button>
    </div>
  )
}

const meta: Meta<typeof UseTitlePreview> = {
  title: 'Hooks/useTitle',
  component: UseTitlePreview,
}

export default meta

export const Basic: StoryObj<typeof meta> = {}
