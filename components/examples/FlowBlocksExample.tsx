import { spawnAutoFitGridTemplate } from '../../styles/StyleSnippets'
import Card from '../../uikit/Card'
import Div from '../../uikit/Div'
import ExampleCard from './ExampleCard'
import ExampleGroup from './ExampleGroup'

export default function FlowBlocksExample() {
  return (
    <ExampleCard title='FlowBlocksExample' category='misc'>
      <ExampleGroup caption='basic example'>
        {/* TODO: <BlockGen> 阵列器 */}
        <Div className='grid w-full gap-3' style={[spawnAutoFitGridTemplate('10em')]}>
          <Card className='bg-block-semi-dark w-full flex-grow' style={{ aspectRatio: '1 / 1' }} />
          <Card className='bg-block-semi-dark w-full flex-grow' style={{ aspectRatio: '1 / 1' }} />
          <Card className='bg-block-semi-dark w-full flex-grow' style={{ aspectRatio: '1 / 1' }} />
          <Card className='bg-block-semi-dark w-full flex-grow' style={{ aspectRatio: '1 / 1' }} />
          <Card className='bg-block-semi-dark w-full flex-grow' style={{ aspectRatio: '1 / 1' }} />
          <Card className='bg-block-semi-dark w-full flex-grow' style={{ aspectRatio: '1 / 1' }} />
          <Card className='bg-block-semi-dark w-full flex-grow' style={{ aspectRatio: '1 / 1' }} />
          <Card className='bg-block-semi-dark w-full flex-grow' style={{ aspectRatio: '1 / 1' }} />
          <Card className='bg-block-semi-dark w-full flex-grow' style={{ aspectRatio: '1 / 1' }} />
          <Card className='bg-block-semi-dark w-full flex-grow' style={{ aspectRatio: '1 / 1' }} />
        </Div>
      </ExampleGroup>
    </ExampleCard>
  )
}
