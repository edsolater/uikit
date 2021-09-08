import { useEffect } from 'react'
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
        {/* TODO: <BlockGen> 阵列器 */}
        <Div className='grid w-full gap-3' style={[genGridTemplate({ itemMinWidth: '10em' })]}>
          {Array.from({ length: 20 }, (_, idx) => (
            <Card key={idx} className='bg-block-semi-light w-full rounded' style={{ aspectRatio: '1 / 1' }} />
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
