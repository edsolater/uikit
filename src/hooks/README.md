# hooks 目录入口

## 目录职责

- 本目录负责承载对外暴露的 hooks 与相关 primitive。
- 本目录同时承载这些能力的目录级约定文档。
- 本目录不承载某一个具体 hook 的完整业务说明；具体职责边界仍应写在对应源码文件开头。

## 先看什么

- 先看 [naming.md](./naming.md)，确认新增 hook / primitive 应该怎么命名。
- 再看 [writing.md](./writing.md)，确认源码文件头、出口注释和新增时的同步要求。
- 再看 [index.ts](./index.ts)，确认当前哪些 hooks 已经进入稳定对外出口。

## File Map

- `naming.md`：hooks 与 primitive 的命名约定，重点是领域词怎么写。
- `writing.md`：hooks 代码文件的写法约定，重点是职责注释、出口注释和同步要求。
- `index.ts`：稳定 hook 出口汇总。
- `createState/`：无领域、全领域通用的基础状态能力。
- `value-state/`：ValueState 领域的一组状态型 hooks。
- 其余单文件或子目录：各自负责对应领域的 hook / primitive 实现。

## 当前目录的阅读口径

- 如果你要新增一个 hook，先判断它是不是无领域通用基础设施。
- 如果不是，就先确定它的领域词，再开始写名字和文件头注释。
- 如果当前目录规则还不足以支撑新命名，应先补文档，再落代码。