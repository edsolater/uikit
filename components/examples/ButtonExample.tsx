import Button from '../../uikit/Button'
import ExampleCard from './ExampleCard'
import ExampleGroup from './ExampleGroup'

export default function ButtonExample() {
  return (
    <ExampleCard title='Button' category='uikit'>
      <ExampleGroup caption='basic example'>
        <Button>Tap</Button>
      </ExampleGroup>

      <ExampleGroup caption='type: fill(default)'>
        <Button /* type='fill' */ size='large'>Large</Button>
        <Button /* type='fill' */ /* size='medium' */>medium</Button>
        <Button /* type='fill' */ size='small'>small</Button>
      </ExampleGroup>

      <ExampleGroup caption='type: outline'>
        <Button type='outline' size='large'>
          Large
        </Button>
        <Button type='outline' /* size='medium' */>medium</Button>
        <Button type='outline' size='small'>
          small
        </Button>
      </ExampleGroup>

      <ExampleGroup caption='type: outline'>
        <Button type='text' size='large'>
          Large
        </Button>
        <Button type='text' /* size='medium' */>medium</Button>
        <Button type='text' size='small'>
          small
        </Button>
      </ExampleGroup>
    </ExampleCard>
  )
}
