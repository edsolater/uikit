import useToggle from '../../hooks/useToggle'
import Button from '../../uikit/Button'
import Card from '../../uikit/Card'
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
        <Transition show={isShow}>
          <Card className='w-[200px] h-[300px] ' bgimgSrc='linear-gradient(dodgerblue,skyblue)' />
        </Transition>
      </ExampleGroup>
    </ExampleCard>
  )
}

export default TransitionExample
