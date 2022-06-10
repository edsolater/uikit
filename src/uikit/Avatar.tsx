import React from 'react'
import Image from './Image'
import Div, { DivProps } from './Div'
import { tailwindColors } from '../styles'

export interface CoinAvatarProps {
  /** this is a prop for faster develop */
  iconSrc?: string
}

export default function Avatar({ iconSrc, ...divProps }: CoinAvatarProps & DivProps) {
  // if (!token && !iconSrc) return null
  const src = iconSrc

  return (
    <Div
      {...divProps}
      icss={{
        width: 64,
        height: 64,
        borderRadius: '50%',
        backgroundColor: tailwindColors.gray200,
        display: 'grid',
        placeItems: 'center'
      }}
    >
      {iconSrc ? <Image src={src} /> : divProps.children}
    </Div>
  )
}
