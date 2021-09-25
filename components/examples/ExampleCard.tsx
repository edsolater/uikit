import Card, { CardProps } from '../../uikit/Card'

interface ExampleCardProps extends CardProps {
  category?: 'hooks' | 'uikit' | 'templateComponent' | 'misc'
  subCategory?: 'headless'
  title?: string
}
export default function ExampleCard(props: ExampleCardProps) {
  return (
    <Card
      {...props}
      className={[
        'grid relative gap-8 shadow-xl bg-block-dark w-[clamp(400px,80vw,1200px)] my-8 mx-auto rounded-2xl p-4',
        props.className
      ]}
    >
      <h1>{props.title}</h1>
      {props.children}
    </Card>
  )
}
