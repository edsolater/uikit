import React from 'react'
import Button from '../uikit/Button'
import ExampleCard from './ExampleCard'
import ExampleGroup from './ExampleGroup'

export default function ButtonExample() {
  return (
    <ExampleCard title='Button' category='uikit'>
      <ExampleGroup caption='different button type'>
        <Button type='fill'>fill</Button>
        <Button type='outline'>border</Button>
        <Button type='text'>text</Button>
      </ExampleGroup>

      <ExampleGroup caption='different button size'>
        <Button /* type='fill' */ size='large'>Large</Button>
        <Button /* type='fill' */ /* size='medium' */>medium</Button>
        <Button /* type='fill' */ size='small'>small</Button>
      </ExampleGroup>

      <ExampleGroup caption='different button size'>
        <Button type='outline' size='large'>
          Large
        </Button>
        <Button type='outline' /* size='medium' */>medium</Button>
        <Button type='outline' size='small'>
          small
        </Button>
      </ExampleGroup>

      <ExampleGroup caption='different button size'>
        <Button type='text' size='large'>
          Large
        </Button>
        <Button type='text' /* size='medium' */>medium</Button>
        <Button type='text' size='small'>
          small
        </Button>
      </ExampleGroup>
    </ExampleCard>
  )
}
