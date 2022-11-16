import { DivChildNode } from './Div'
import { uikit } from './utils'

export interface TextProps {
  children?: DivChildNode
}

export const Text = uikit<TextProps>('Text', (KitRoot) => (props) => <KitRoot>{props.children}</KitRoot>)
