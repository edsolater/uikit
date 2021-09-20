import type { DivProps } from '../../uikit/Div'
import UIRoot from '../../uikit/UIRoot'

interface ExampleCardProps extends DivProps {
  category?: 'hooks' | 'uikit' | 'templateComponent' | 'misc'
  subCategory?: 'headless'
  title?: string
}
export default function ExampleCard(props: ExampleCardProps) {
  return (
    <UIRoot
      {...props}
      _className='grid relative gap-8 shadow-xl  w-[clamp(400px,80vw,1200px)] my-8 mx-auto rounded-lg py-2 px-4'
    >
      <h1>{props.title}</h1>
      {props.children}
    </UIRoot>
  )
}
