import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Button } from '../components/Button'
import { useTitle } from './useTitle'

function UseTitlePreview() {
  const samples = ['Storybook Title', 'Hook State Title', 'React Kit Preview']
  const [index, setIndex] = useState(0)
  const title = useTitle(samples[index])

  return (
    <div style={{ display: 'grid', gap: 16, maxWidth: 320 }}>
      <strong>{title}</strong>
      <Button variant="ghost" onClick={() => setIndex((index + 1) % samples.length)}>
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