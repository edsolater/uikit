import { ReactNode, ReactHTML, createElement } from 'react'

type ReactComponent = () => JSX.Element

/**
 * @example
 * <RenderAs as={isScrollThumbActive ? 'div' : 'section'}>hello world</RenderSwitch>
 */
export default function RenderAs({ children, as }: { children?: ReactNode; as?: keyof ReactHTML | ReactComponent }) {
  return as ? createElement(as, {}, children) : null
}
