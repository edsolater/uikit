import React from 'react'
import createManager from '../../uikit/Manager'
import ExampleCard from './ExampleCard'
import ExampleGroup from './ExampleGroup'

export const FakeManager = createManager<{ text?: string | undefined }>({ key: 'FakeManager', childrenKeys: ['Foo'] })

export default function FakeManagerExample() {
  return (
    <ExampleCard title='createManager' category='componentFactory'>
      <ExampleGroup caption='basic example'>
        <FakeManager>
          <FakeManager.Foo>hello</FakeManager.Foo>
        </FakeManager>
      </ExampleGroup>
    </ExampleCard>
  )
}
