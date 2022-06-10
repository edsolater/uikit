import { attachBoundingBoxCSSVariable } from '../../domSnippets/attachBoundingBoxCSSVariable'
import range from '../../functions/fnkit/range'
import { useWindowFeaturePointerVariable } from '../../hooks/useWindowFeaturePointerVariable'
import { icssGridTemplate } from '../../styles'
import Card from '../../uikit/Card'
import Div from '../../uikit/Div'
import ExampleCard from './ExampleCard'
import ExampleGroup from './ExampleGroup'

export default function FlowBlocksExample() {
  useWindowFeaturePointerVariable()

  return (
    <ExampleCard title='FlowBlocksExample' category='misc'>
      <ExampleGroup caption='basic example'>
        <Div className='grid w-full gap-3' icss_={icssGridTemplate({ itemMinWidth: '10em' })}>
          {range(20, (idx) => (
            <Card
              key={idx}
              className='bg-block-semi-dark w-full rounded-lg  hover:ring-block-light ring-transparent win10-light-spot ring-8 ring-inset hover:ring-opacity-60'
              style={{ aspectRatio: '1 / 1' }}
              icss={{ ':hover': { 'backgroundColor': 'dodgerblue' } }}
              domRef={attachBoundingBoxCSSVariable}
            />
          ))}
        </Div>
      </ExampleGroup>
    </ExampleCard>
  )
}
