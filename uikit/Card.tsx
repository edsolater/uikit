import type { CSSProperties } from 'react'
import type { DivProps } from './Div'
import UIRoot from './UIRoot'

export interface CardProps extends DivProps {
  bg: CSSProperties['background']
}

/**
 * @BaseUIComponent
 */
export default function Card({ bg, ...restProps }: CardProps) {
  return <UIRoot _className='Card  rounded-md py-4 px-8' _style={{ background: bg }} {...restProps} />
}