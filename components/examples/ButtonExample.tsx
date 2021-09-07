import Button, { buttonBaseStyle } from '../../uikit/Button'
import ExampleCard from './ExampleCard'
import ExampleGroup from './ExampleGroup'

export default function ButtonExample() {
  return (
    <ExampleCard title='Button' category='uikit'>
      <ExampleGroup caption='basic example'>
        <Button className={buttonBaseStyle()}>Tap</Button>
      </ExampleGroup>

      <ExampleGroup caption='type: fill(default)'>
        <Button className={buttonBaseStyle({ size: 'large' })}>Large</Button>
        <Button className={buttonBaseStyle()}>medium</Button>
        <Button className={buttonBaseStyle({ size: 'small' })}>small</Button>
      </ExampleGroup>

      <ExampleGroup caption='type: outline'>
        <Button className={buttonBaseStyle({ size: 'large', type: 'outline' })}>Large</Button>
        <Button className={buttonBaseStyle({ size: 'medium', type: 'outline' })}>medium</Button>
        <Button className={buttonBaseStyle({ size: 'small', type: 'outline' })}>small</Button>
      </ExampleGroup>

      <ExampleGroup caption='type: outline'>
        <Button className={buttonBaseStyle({ size: 'large', type: 'text' })}>Large</Button>
        <Button className={buttonBaseStyle({ size: 'medium', type: 'text' })}>medium</Button>
        <Button className={buttonBaseStyle({ size: 'small', type: 'text' })}>small</Button>
      </ExampleGroup>
    </ExampleCard>
  )
}
