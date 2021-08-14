import { changeCase } from '@edsolater/fnkit'

export default function TestBox() {
  return (
    <div style={{ width: 200, height: 200, background: 'dodgerblue' }}>
      {changeCase('hello-world', { to: 'PascalCase' })}
    </div>
  )
}
