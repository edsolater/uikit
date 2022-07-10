import { ComponentMeta, ComponentStory } from '@storybook/react'

import { Div } from '../components/Div'
import { Input } from '../components/Input'
import { useSignalState } from '../hooks/useSignalState.temp'
import useLocalStorageItem from '../hooks/useStorage.temp'

const storySettings = {
  component: Input,
  argTypes: {
    // themeColor: { control: 'color' }
  }
} as ComponentMeta<typeof Input>

const Template: ComponentStory<typeof Input> = (args) => {
  const [inputValue, setInputValue, signal] = useSignalState(undefined as string | undefined, {
    plugin: [({ newState }) => ({ overwritedState: newState, additionalSignalMethods: { hello: () => 3 } })]
  })
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
