import range from '../../functions/fnkit/range'
import Card from '../../uikit/Card'
import ScrollDiv from '../../uikit/ScrollDiv'
import ExampleCard from './ExampleCard'
import ExampleGroup from './ExampleGroup'

export default function ScrollDivExample() {
  return (
    <ExampleCard title='ScrollDivExample' category='uikit'>
      <ExampleGroup caption='basic example'>
        <ScrollDiv className='h-80'>
          {range(10, (idx) => (
            <Card
              boundingBoxCSS
              key={idx}
              className='bg-block-semi-dark w-64 m-4 rounded-lg  hover:ring-block-light ring-transparent win10-light-spot ring-8 ring-inset hover:ring-opacity-60'
              style={{ aspectRatio: '1 / 1' }}
            />
          ))}
        </ScrollDiv>
      </ExampleGroup>
    </ExampleCard>
  )
}
