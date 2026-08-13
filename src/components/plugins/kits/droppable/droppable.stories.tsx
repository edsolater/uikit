import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { DroppableDemo } from './droppable.demo'

const meta: Meta<typeof DroppableDemo> = {
  title: 'Plugins/Droppable',
  component: DroppableDemo,
}

export default meta

export const InternalAndExternal: StoryObj<typeof meta> = {}
