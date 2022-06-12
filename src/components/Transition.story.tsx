import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { Button } from './Button'
import { Transition } from './Transition'
import { Div } from './Div'
import { useToggle } from '@edsolater/hookit'
import Card from './Card'
import { transitionPresetFadeInOut } from './Transition/effects'

const storySettings = {
  component: Transition,
  argTypes: {}
} as ComponentMeta<typeof Button>

const Template: ComponentStory<typeof Transition> = (props) => {
  const [isShow, { toggle }] = useToggle()
  return (
    <Div>
      <Div>Click the button to see demo</Div>
      <Button onClick={toggle}> isShow: {String(isShow)} </Button>
      <Transition show={isShow} {...props}>
        {({ phase }) => (
          <Card className='w-[200px] h-[300px] translate-x-0 ' bgimgSrc='linear-gradient(dodgerblue,skyblue)'>
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
