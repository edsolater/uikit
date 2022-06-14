import { Fragment, useEffect, useRef } from 'react'
import { attachPointerMove } from '../functions/dom/gesture/pointerMove'
import { setInlineStyle } from '../functions/dom/setCSS'
import { mapElementChildren } from '../functions/react'
import { AddProps } from './AddProps'
import Col from './Col'
import { DivProps, Div } from './Div'
import { createDataTag, hasTag } from './Div/tag'
import Row, { RowProps } from './Row'

export type RowSplitProps = RowProps & { dir?: 'x' | 'y'; lineProps?: DivProps }

export default function SplitView({ lineProps, dir = 'x', ...props }: RowSplitProps) {
  const refs = useRef<{ line: HTMLElement; prevWindowItem: HTMLElement; nextWindowItem?: HTMLElement }[]>([])

  // regist move line handler
  useEffect(() => {
    console.log('refs.current: ', refs.current)
    const takeRestSpaceWindowItemIndex = refs.current
      .map(({ prevWindowItem }) => prevWindowItem)
      .findIndex((i) => hasTag(i, takeSlipRestSpace))
    refs.current.forEach(({ prevWindowItem, line, nextWindowItem }, idx) => {
      if (takeRestSpaceWindowItemIndex >= 0 && idx >= takeRestSpaceWindowItemIndex) {
        if (!nextWindowItem) return
        let initWidth = nextWindowItem.clientWidth
        let initHeight = nextWindowItem.clientHeight
        attachPointerMove(line, {
          move: ({ totalDelta, isFirstEvent }) => {
            if (isFirstEvent) {
              initWidth = nextWindowItem.clientWidth
              initHeight = nextWindowItem.clientHeight
            } else {
              setInlineStyle(nextWindowItem, 'flex', 'none')
              dir === 'x'
                ? setInlineStyle(nextWindowItem, 'width', initWidth - totalDelta.dx)
                : setInlineStyle(nextWindowItem, 'height', initHeight - totalDelta.dy)
            }
          }
        })
      } else {
        let initWidth = prevWindowItem.clientWidth
        let initHeight = prevWindowItem.clientHeight
        attachPointerMove(line, {
          move: ({ totalDelta, isFirstEvent }) => {
            if (isFirstEvent) {
              initWidth = prevWindowItem.clientWidth
              initHeight = prevWindowItem.clientHeight
            } else {
              setInlineStyle(prevWindowItem, 'flex', 'none')
              dir === 'x'
                ? setInlineStyle(prevWindowItem, 'width', initWidth + totalDelta.dx)
                : setInlineStyle(prevWindowItem, 'height', initHeight + totalDelta.dy)
            }
          }
        })
      }
    })
  }, [])

  const Wrapper = dir === 'x' ? Row : Col
  return (
    <Wrapper {...props}>
      {mapElementChildren(props.children, (childNode, idx) => (
        <Fragment key={idx}>
          {/*  Window  */}
          <AddProps
            domRef={(el) => {
              console.log('el: ', el)
              // update to prevGroup
              if (idx >= 1) {
                refs.current[idx - 1] = { ...refs.current[idx - 1], nextWindowItem: el }
              }
              // update to currGroup
              refs.current[idx] = { ...refs.current[idx], prevWindowItem: el }
            }}
            icss={{ flex: 1, willChange: 'width, height', transition: '75m' }}
          >
            {childNode}
          </AddProps>
          {/* line */}
          <Div
            domRef_={(el) => (refs.current[idx] = { ...refs.current[idx], line: el })}
            icss_={[
              {
                ':last-child': {
                  display: 'none'
                }, // TODO: should not render this DOM

                flex: 'none',
                backgroundColor: '#ec123c91',
                ':hover': { backgroundColor: 'dodgerblue' },
                transition: '75ms'
              },
              dir === 'x' ? { width: 4, cursor: 'e-resize' } : { height: 4, cursor: 'n-resize' }
            ]}
            {...lineProps}
          ></Div>
        </Fragment>
      ))}
    </Wrapper>
  )
}

const takeSlipRestSpace = createDataTag({ key: 'RowSplit', value: 'container-flexible' })
SplitView.takeSlipRestSpace = takeSlipRestSpace
