import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { DraggableDemo } from './draggable.demo'

const meta: Meta<typeof DraggableDemo> = {
  title: 'Plugins/Draggable',
  component: DraggableDemo,
}

export default meta

export const SourceAndPlaceholder: StoryObj<typeof meta> = {}
