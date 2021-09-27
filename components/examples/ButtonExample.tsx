import Button from '../../uikit/Button'
import { buttonTint } from '../../uikit/ButtonTint'
import ExampleCard from './ExampleCard'
import ExampleGroup from './ExampleGroup'

export default function ButtonExample() {
  return (
    <ExampleCard title='Button' category='uikit'>
      <ExampleGroup caption='basic example'>
        <Button>Tap</Button>
      </ExampleGroup>

      <ExampleGroup caption='type: fill(default)'>
        <Button tint={{ size: 'large' }}>Large</Button>
        <Button>medium</Button>
        <Button tint={{ size: 'small' }}>small</Button>
      </ExampleGroup>

      <ExampleGroup caption='type: outline'>
        <Button tint={{ size: 'large', type: 'outline' }}>Large</Button>
        <Button tint={{ size: 'medium', type: 'outline' }}>medium</Button>
        <Button tint={{ size: 'small', type: 'outline' }}>small</Button>
      </ExampleGroup>

      <ExampleGroup caption='type: text'>
        <Button tint={{ size: 'large', type: 'text' }}>Large</Button>
        <Button tint={{ size: 'medium', type: 'text' }}>medium</Button>
        <Button tint={{ size: 'small', type: 'text' }}>small</Button>
      </ExampleGroup>

      <ExampleGroup caption='headless type'>
        <Button noDefaultTint className={buttonTint({ size: 'large', type: 'outline' })}>
          Large
        </Button>
      </ExampleGroup>
    </ExampleCard>
  )
}
