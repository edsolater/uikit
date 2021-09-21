import { useEffect } from 'react'
import { genGridTemplate } from '../../styles/styleSnippets'
import Card from '../../uikit/Card'
import Div from '../../uikit/Div'
import ExampleCard from './ExampleCard'
import ExampleGroup from './ExampleGroup'
import GradientGrid from '../../uikit/BgLightEffect'

export default function FlowBlocksExample() {
  useEffect(() => {
    attachPointerMoveCSSVariable()
  }, [])

  return (
    <ExampleCard title='FlowBlocksExample' category='misc' className='bg-block-dark'>
      <ExampleGroup caption='basic example'>
        {/* TODO: <BlockGen> 阵列器 */}
        <GradientGrid>
          <Div className='grid w-full gap-3' style={[genGridTemplate({ itemMinWidth: '10em' })]}>
            {Array.from({ length: 20 }, (_, idx) => (
              <Card key={idx} className='bg-block-semi-dark w-full rounded' style={{ aspectRatio: '1 / 1' }} />
            ))}
          </Div>
        </GradientGrid>
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
