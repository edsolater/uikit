import useToggle from '../../hooks/useToggle'
import Button from '../../uikit/Button'
import Card from '../../uikit/Card'
import Div from '../../uikit/Div'
import Transition from '../../uikit/Transition'
import ExampleCard from './ExampleCard'
import ExampleGroup from './ExampleGroup'

/**
 * Button 的使用示例
 */
const TransitionExample = () => {
  const [isShow, { toggle }] = useToggle()
  return (
    <ExampleCard title='Transition' category='uikit' subCategory='headless'>
      <Button onClick={toggle}> isShow: {String(isShow)} </Button>
      <ExampleGroup caption='basic example'>
        <Transition show={isShow} effect={['fade-in/fade-out', 'from-left']}>
          {({ phase, inTransition }) => (
            <Card className='w-[200px] h-[300px] ' bgimgSrc='linear-gradient(dodgerblue,skyblue)'>
              <Div>phase: {phase}</Div>{' '}
              {/* TODO: 展示变量字段是个常见需求， 应该提取一个专门的组件，或建造一个快捷方式 */}
              <Div>inTransition: {String(inTransition)} </Div>
            </Card>
          )}
        </Transition>
      </ExampleGroup>
    </ExampleCard>
  )
}

export default TransitionExample
