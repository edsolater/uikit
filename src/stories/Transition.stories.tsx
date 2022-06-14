import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { Button } from '../components/Button'
import { Transition } from '../components/Transition'
import { Div } from '../components/Div'
import { useToggle } from '@edsolater/hookit'
import { Card } from '../components/Card'
import { transitionPresetFadeInOut } from '../components/Transition/effects'

const storySettings = {
  component: Transition,
  argTypes: {}
} as ComponentMeta<typeof Transition>

const Template: ComponentStory<typeof Transition> = (props) => {
  const [isShow, { toggle }] = useToggle()
  return (
    <Div icss={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Button onClick={toggle}> isShow: {String(isShow)} </Button>
      <Transition show={isShow} {...props}>
        {({ phase }) => (
          <Card
            icss={{
              width: 200,
              height: 300
            }}
            bgimgSrc='linear-gradient(dodgerblue,skyblue)'
          >
            <Div>phase: {phase}</Div>
          </Card>
        )}
      </Transition>
    </Div>
  )
}

export default storySettings
export const Primary = Template.bind({})
Primary.args = {
  presets: [transitionPresetFadeInOut],
  onBeforeEnter: () => {
    console.log('on before enter')
  },
  onAfterEnter: () => {
    console.log('on after enter')
  },
  onBeforeLeave: () => {
    console.log('on before leave')
  },
  onAfterLeave: () => {
    console.log('on after leave')
  }
}
