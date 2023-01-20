import { ComponentMeta, ComponentStory } from '@storybook/react'

import { useToggle }from '../hooks'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Div } from '../Div/Div'
import { FadeIn } from '../components/FadeIn'

const storySettings = {
  component: FadeIn,
  argTypes: {}
} as ComponentMeta<typeof FadeIn>

const Template: ComponentStory<typeof FadeIn> = (props) => {
  const [isShow, { toggle }] = useToggle()
  return (
    <Div icss={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

export const Basic = Template.bind({})
Basic.args = {}
