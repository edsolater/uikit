import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { DraggableExample } from './draggable.example'

const meta: Meta<typeof DraggableExample> = {
  title: 'Plugins/Draggable',
  component: DraggableExample,
}

export default meta

export const SourceInTopLayer: StoryObj<typeof meta> = {}
