import { createState, val, Loading, Errored } from '@/foundation'

/** 由界面控制请求完成和失败，展示同一异步读取链。 */
export function AsyncStateExample() {
  const request = Promise.withResolvers<string>()
  const message = createState(request.promise)
  return (
    <section aria-label="异步状态">
      <h2>异步状态</h2>
      <p>选择请求结果，观察等待、完成和失败。</p>
      <button onClick={() => request.resolve('请求已完成')}>完成请求</button>
      <button onClick={() => request.reject(new Error('请求失败'))}>拒绝请求</button>
      <Errored fallback={error => <p role="alert">失败：{String(error())}</p>}>
        <Loading fallback={<p role="status">等待请求</p>}>
          <p data-result>结果：{val(message)}</p>
        </Loading>
      </Errored>
    </section>
  )
}
