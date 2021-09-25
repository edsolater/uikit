import { useEffect } from 'react'
import range from '../../functions/fnkit/range'
import { genGridTemplate } from '../../styles/styleSnippets'
import Card from '../../uikit/Card'
import Div from '../../uikit/Div'
import ExampleCard from './ExampleCard'
import ExampleGroup from './ExampleGroup'

export default function FlowBlocksExample() {
  useEffect(() => {
    attachPointerMoveCSSVariable()
  }, [])

  return (
    <ExampleCard title='FlowBlocksExample' category='misc'>
      <ExampleGroup caption='basic example'>
        <Div className='grid w-full gap-3' style={[genGridTemplate({ itemMinWidth: '10em' })]}>
          {range(20, (idx) => (
            <Card
              boundingBoxCSS
              key={idx}
              className='bg-block-semi-dark w-full rounded-lg  hover:ring-block-light ring-transparent win10-light-spot ring-8 ring-inset hover:ring-opacity-60'
              style={{ aspectRatio: '1 / 1' }}
            />
          ))}
        </Div>
      </ExampleGroup>
    </ExampleCard>
  )
}
function attachPointerMoveCSSVariable() {
  document.addEventListener(
    'pointermove',
    (ev) => {
      document.documentElement.style.setProperty('--pointer-x', String(ev.pageX))
      document.documentElement.style.setProperty('--pointer-y', String(ev.pageY))
    },
    { passive: true }
  )
}
