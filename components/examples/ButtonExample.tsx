import Button from '../../uikit/Button'
import { buttonFlavor } from '../../uikit/ButtonFlavor'
import ExampleCard from './ExampleCard'
import ExampleGroup from './ExampleGroup'

export default function ButtonExample() {
  return (
    <ExampleCard title='Button' category='uikit'>
      <ExampleGroup caption='basic example'>
        <Button>Tap</Button>
      </ExampleGroup>

      <ExampleGroup caption='type: fill(default)'>
        <Button flavor={{ size: 'large' }}>Large</Button>
        <Button>medium</Button>
        <Button flavor={{ size: 'small' }}>small</Button>
      </ExampleGroup>

      <ExampleGroup caption='type: outline'>
        <Button flavor={{ size: 'large', type: 'outline' }}>Large</Button>
        <Button flavor={{ size: 'medium', type: 'outline' }}>medium</Button>
        <Button flavor={{ size: 'small', type: 'outline' }}>small</Button>
      </ExampleGroup>

      <ExampleGroup caption='type: text'>
        <Button flavor={{ size: 'large', type: 'text' }}>Large</Button>
        <Button flavor={{ size: 'medium', type: 'text' }}>medium</Button>
        <Button flavor={{ size: 'small', type: 'text' }}>small</Button>
      </ExampleGroup>

      <ExampleGroup caption='headless type'>
        <Button noDefaultFlavor className={buttonFlavor({ size: 'large', type: 'outline' })}>
          Large
        </Button>
      </ExampleGroup>
    </ExampleCard>
  )
}
