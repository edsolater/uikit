import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { ScopeDemo } from './scope.demo'

const meta: Meta<typeof ScopeDemo> = {
  title: 'Plugins/Scope',
  component: ScopeDemo,
}

export default meta

export const DragAndDropBoundary: StoryObj<typeof meta> = {}
