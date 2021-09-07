import Button from '../../uikit/Button'
import { buttonBaseStyle } from '../../uikit/ButtonBaseStyle'
import ExampleCard from './ExampleCard'
import ExampleGroup from './ExampleGroup'

export default function ButtonExample() {
  return (
    <ExampleCard title='Button' category='uikit'>
      <ExampleGroup caption='basic example'>
        <Button>Tap</Button>
      </ExampleGroup>

      <ExampleGroup caption='type: fill(default)'>
        <Button baseStyle={{ size: 'large' }}>Large</Button>
        <Button>medium</Button>
        <Button baseStyle={{ size: 'small' }}>small</Button>
      </ExampleGroup>

      <ExampleGroup caption='type: outline'>
        <Button baseStyle={{ size: 'large', type: 'outline' }}>Large</Button>
        <Button baseStyle={{ size: 'medium', type: 'outline' }}>medium</Button>
        <Button baseStyle={{ size: 'small', type: 'outline' }}>small</Button>
      </ExampleGroup>

      <ExampleGroup caption='type: text'>
        <Button baseStyle={{ size: 'large', type: 'text' }}>Large</Button>
        <Button baseStyle={{ size: 'medium', type: 'text' }}>medium</Button>
        <Button baseStyle={{ size: 'small', type: 'text' }}>small</Button>
      </ExampleGroup>

      <ExampleGroup caption='headless type'>
        <Button baseStyle='none' className={buttonBaseStyle({ size: 'large', type: 'outline' })}>
          Large
        </Button>
      </ExampleGroup>
    </ExampleCard>
  )
}
