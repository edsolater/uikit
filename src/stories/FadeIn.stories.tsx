import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { Button } from '../components/Button'
import { Transition } from '../components/Transition'
import { Div } from '../components/Div'
import { useToggle } from '@edsolater/hookit'
import { Card } from '../components/Card'
import { transitionPresetFadeInOut } from '../components/Transition/effects'
import { FadeIn } from '../components/FadeIn'

const storySettings = {
  component: FadeIn,
  argTypes: {}
} as ComponentMeta<typeof FadeIn>

const Template: ComponentStory<typeof Transition> = (props) => {
  const [isShow, { toggle }] = useToggle()
  return (
    <Div icss={{display:'flex', flexDirection:'column', gap: '16px'}}>
      <Button onClick={toggle}> isShow: {String(isShow)} </Button>
      <FadeIn show={isShow}>
        <Card
          icss={{
            width: 200,
            height: 300
          }}
          bgimgSrc='linear-gradient(dodgerblue,skyblue)'
        >
          fadein
        </Card>
      </FadeIn>
    </Div>
  )
}

export default storySettings

export const Primary = Template.bind({})
Primary.args = {}
