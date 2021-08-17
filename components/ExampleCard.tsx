import React from 'react'
import BaseUIDiv from '../baseui/BaseUIDiv'
import { DivProps } from '../baseui/Div'

interface ExampleCardProps extends DivProps {
  category?: 'hooks' | 'baseUI' | 'templateComponent'
  title?: string
}
export default function ExampleCard(props: ExampleCardProps) {
  return (
    <BaseUIDiv
      {...props}
      _className='grid relative gap-8 shadow-xl w-[clamp(400px,80vw,1200px)] my-8 mx-auto rounded-lg py-2 px-4'
    >
      <h1>{props.title}</h1>
      {props.children}
    </BaseUIDiv>
  )
}
