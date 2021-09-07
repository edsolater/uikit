import Card from '../../uikit/Card'
import ExampleCard from './ExampleCard'
import ExampleGroup from './ExampleGroup'

export default function FlowBlocksExample() {
  return (
    <ExampleCard title='FlowBlocksExample' category='misc'>
      <ExampleGroup caption='basic example'>
        <Card className='bg-block-dark w-40 h-40' />
        <Card className='bg-block-dark w-40 h-40' />
        <Card className='bg-block-dark w-40 h-40' />
        <Card className='bg-block-dark w-40 h-40' />
        <Card className='bg-block-dark w-40 h-40' />
        <Card className='bg-block-dark w-40 h-40' />
        <Card className='bg-block-dark w-40 h-40' />
        <Card className='bg-block-dark w-40 h-40' />
        <Card className='bg-block-dark w-40 h-40' />
        <Card className='bg-block-dark w-40 h-40' />
      </ExampleGroup>
    </ExampleCard>
  )
}
