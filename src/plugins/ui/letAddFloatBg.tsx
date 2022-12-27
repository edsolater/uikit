import { useLayoutEffect, useMemo } from 'react'
import { Motion, MotionProps } from '../../components'
import { Div, DivProps } from '../../Div'
import { useDOM } from '../../hooks'
import { onEvent, getSiblings } from '../../utils'
import { createPlugin } from '../createPlugin'
import { WrappedBy } from '../misc/WrappedBy'

export type LetAddFloatBgOptions = {
  floatBgProps?: DivProps
  MotionProps?: MotionProps
  defaultActiveItemIndex?: number
  activeItemIndex?: number
  _lockSelf?: boolean
}

export const letAddFloatBg = createPlugin<LetAddFloatBgOptions>(
  ({
    floatBgProps,
    MotionProps,
    defaultActiveItemIndex,
    activeItemIndex,
    _lockSelf = activeItemIndex != null,
    ...props
  }) => {
    const [dom, setDOM] = useDOM()
    const [activeTab, setActiveTab] = useDOM()
    const siblings = useMemo(() => getSiblings(dom), [dom])

    useLayoutEffect(() => {
      const subscriptions = siblings.map((el) =>
        onEvent(el, 'click', ({ el }) => {
          if (!_lockSelf) setActiveTab(el)
        })
      )
      return () => subscriptions.forEach((subscription) => subscription.abort())
    }, [siblings])

    useLayoutEffect(() => {
      if (defaultActiveItemIndex != null) siblings.at(defaultActiveItemIndex)?.click()
      if (activeItemIndex != null && siblings[activeItemIndex]) setActiveTab(siblings[activeItemIndex])
    }, [siblings, activeItemIndex])

    return {
      children: (
        <>
          <Div
            shadowProps={floatBgProps}
            domRef={setDOM}
            icss={{
              width: activeTab?.offsetWidth,
              height: activeTab?.offsetHeight,
              top: activeTab?.offsetTop,
              left: activeTab?.offsetLeft,
              position: 'absolute',
              zIndex: '-1',
              background: '#d1d3d6'
            }}
            className='Tabs-active-bg-panel'
            plugin={WrappedBy((node) => (
              <Motion {...MotionProps}>{node}</Motion>
            ))}
          ></Div>
          {props.children}
        </>
      )
    }
  }
)
