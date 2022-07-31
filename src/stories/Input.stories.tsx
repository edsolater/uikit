import { ComponentMeta, ComponentStory } from '@storybook/react'

import { Div } from '../components/Div/Div'
import { Input } from '../components/Input'
import useLocalStorageItem from '../hooks/useStorage.temp'

const storySettings = {
  component: Input,
  argTypes: {
    // themeColor: { control: 'color' }
  }
} as ComponentMeta<typeof Input>

const Template: ComponentStory<typeof Input> = (args) => {
  const [inputValue, setInputValue] = useLocalStorageItem<string | undefined>('xxx', '')
  return (
    <Div icss={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Input
        {...args}
        icss={[args.icss, { alignSelf: 'center' }]}
        pattern={/^\w*$/}
        inputMode='text'
        value={inputValue}
        onUserInput={setInputValue}
      />
      <Input
        {...args}
        icss={[args.icss, { alignSelf: 'center' }]}
        pattern={/^\w*$/}
        inputMode='text'
        value={inputValue}
        onUserInput={setInputValue}
      />
    </Div>
  )
}

export default storySettings
export const Basic = Template.bind({})
Basic.args = {}
