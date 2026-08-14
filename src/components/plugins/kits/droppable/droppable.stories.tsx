import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { DroppableExample } from './droppable.example'

const meta: Meta<typeof DroppableExample> = {
  title: 'Plugins/Droppable',
  component: DroppableExample,
}

export default meta

export const InternalAndExternal: StoryObj<typeof meta> = {}
