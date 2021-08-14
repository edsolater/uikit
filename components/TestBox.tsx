import { changeCase } from '@edsolater/fnkit'

import style from './TestBox.module.css'

export default function TestBox() {
  return <div className={style.TestBox}>{changeCase('hello-world', { to: 'PascalCase' })}</div>
}
