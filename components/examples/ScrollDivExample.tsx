import range from '../../functions/fnkit/range'
import Card from '../../uikit/Card'
import ExampleCard from './ExampleCard'
import ExampleGroup from './ExampleGroup'
import ScrollDiv from '../../uikit/ScrollDiv'

export default function ScrollDivExample() {
  return (
    <ExampleCard title='ScrollDivExample' category='uikit'>
      <ExampleGroup caption='basic example'>
        <ScrollDiv className='h-80 w-full'>
          {range(10, (idx) => (
            <Card
              boundingBoxCSS
              key={idx}
              className='bg-block-semi-dark w-44 m-4 rounded-lg  hover:ring-block-light ring-transparent win10-light-spot ring-8 ring-inset hover:ring-opacity-60'
              style={{ aspectRatio: '1 / 1' }}
            />
          ))}
        </ScrollDiv>
      </ExampleGroup>
    </ExampleCard>
  )
}
