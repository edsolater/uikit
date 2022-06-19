import { ComponentMeta, ComponentStory } from '@storybook/react'

import { Div } from '../components/Div'
import { Input } from '../components/Input'

const storySettings = {
  component: Input,
  argTypes: {
    // themeColor: { control: 'color' }
  }
} as ComponentMeta<typeof Input>

const Template: ComponentStory<typeof Input> = (args) => (
  <Div icss={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
    <Input {...args} icss={[args.icss, {alignSelf:'center',}]} isAtuoGrow pattern={/^\d*$/} />
  </Div>
)

export default storySettings
export const Basic = Template.bind({})
Basic.args = {}
