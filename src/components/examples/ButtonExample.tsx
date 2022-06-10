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
        <Button size='lg'>Large</Button>
        <Button>medium</Button>
        <Button size='sm'>small</Button>
      </ExampleGroup>

      <ExampleGroup caption='type: outline'>
        <Button size='lg' variant='outline'>
          Large
        </Button>
        <Button size='md' variant='outline'>
          medium
        </Button>
        <Button size='sm' variant='outline'>
          small
        </Button>
      </ExampleGroup>

      <ExampleGroup caption='type: text'>
        <Button size='lg' variant='text'>
          Large
        </Button>
        <Button size='md' variant='text'>
          medium
        </Button>
        <Button size='sm' variant='text'>
          small
        </Button>
      </ExampleGroup>

    </ExampleCard>
  )
}
