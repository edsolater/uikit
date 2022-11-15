import { uikit } from './utils'

export interface TextProps {}

export const Text = uikit<TextProps>('Text', (KitRoot) => ({ children }) => <KitRoot>{children}</KitRoot>)
