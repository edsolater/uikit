import { Div } from '../../uikit'
import Card, { CardProps } from '../../uikit/Card'

interface ExampleCardProps extends CardProps {
  category?: 'hooks' | 'uikit' | 'templateComponent' | 'misc' | 'componentFactory'
  subCategory?: 'headless'
  title?: string
  grid?: boolean
}
export default function ExampleCard(props: ExampleCardProps) {
  return (
    <Card
      {...props}
      className={[
        'grid relative gap-8 shadow-xl bg-block-dark w-[clamp(400px,80vw,1200px)] my-12 mx-auto rounded-2xl p-4',
        props.className
      ]}
    >
      <Div
        as='h1'
        className='text-3xl text-center font-bold my-4'
        onClick={({ el }) => {
          history.replaceState({}, '', '#' + props.title)
          el.scrollIntoView({ behavior: 'smooth' })
        }}
      >
        {props.title}
      </Div>
      <Div icss={props.grid ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 } : undefined}>
        {props.children}
      </Div>
    </Card>
  )
}
