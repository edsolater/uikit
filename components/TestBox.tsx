import { changeCase } from '@edsolater/fnkit'

export default function TestBox() {
  return (
    <div className='w-[300px] h-[300px] bg-blue-500'>
      {changeCase('hello-world', { to: 'PascalCase' })}
    </div>
  )
}
