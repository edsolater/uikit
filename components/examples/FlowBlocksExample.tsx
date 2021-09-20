import { useEffect, useRef, useState } from 'react'
import { genGridTemplate } from '../../styles/styleSnippets'
import Card from '../../uikit/Card'
import Div from '../../uikit/Div'
import ExampleCard from './ExampleCard'
import ExampleGroup from './ExampleGroup'

export default function FlowBlocksExample() {
  useEffect(() => {
    attachPointerMoveCSSVariable()
  }, [])

  const [boundingBox, setBoundingBox] = useState<DOMRect | undefined>()
  const gridRef = useRef<HTMLDivElement>()

  useEffect(() => {
    if (gridRef.current) {
      setBoundingBox(gridRef.current.getBoundingClientRect())
    }
  }, [])
  return (
    <ExampleCard title='FlowBlocksExample' category='misc' className='bg-block-dark'>
      <ExampleGroup caption='basic example'>
        {/* TODO: <BlockGen> 阵列器 */}
        <Div
          domRef={gridRef}
          className='grid w-full gap-3'
          style={[
            genGridTemplate({ itemMinWidth: '10em' }),
            {
              background: `radial-gradient(circle at calc(var(--pointer-x) * 1px - ${
                boundingBox?.left ?? 0
              } * 1px) calc(var(--pointer-y) * 1px - ${boundingBox?.top ?? 0} * 1px), #fff5, transparent 160px)`
            }
          ]}
        >
          {Array.from({ length: 20 }, (_, idx) => (
            <Card key={idx} className='bg-block-semi-dark w-full rounded' style={{ aspectRatio: '1 / 1' }} />
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
