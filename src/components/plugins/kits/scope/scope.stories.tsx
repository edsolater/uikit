import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { ScopeExample } from './scope.example'

const meta: Meta<typeof ScopeExample> = {
  title: 'Plugins/Scope',
  component: ScopeExample,
}

export default meta

export const DragAndDropBoundary: StoryObj<typeof meta> = {}
