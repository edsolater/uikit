import Card, { CardProps } from '../../uikit/Card'

interface ExampleCardProps extends CardProps {
  category?: 'hooks' | 'uikit' | 'templateComponent' | 'misc' | 'componentFactory'
  subCategory?: 'headless'
  title?: string
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
      <h1 className='text-3xl text-center font-bold my-4'>{props.title}</h1>
      {props.children}
    </Card>
  )
}
