# todo

- 命名并不直观且予以明确
- 各个块下需要暴露几个namespace用object（必须先了解框架的“死代码筛除”功能）
- 有些相似功能， 或太过细碎的功能，没必要拆成多个碎片函数

# overview

## Array

- cleanArray (a shortcut for splice)
- concatArray
- createArray
- createRange
- flatMayArray
- getFirstItem
- getLastItem
- groupByAmount
- insertItem
- remove
- removeItem
- replaceItem

## dateTime

- extractDate
- extractTime
- formatDateString

## dom

- checkInBrowserMainThread

## factionFactory

- bindHead 📝（从命名上看， 语义不够明确）
- bindParams
- bindTail
- cache
- checkProp
- curry
- debounce
- handleError
- overwriteFunctionName 📝 rename to renameFnName
- partlyInvoke
- pipe

## judgers

- \_getType
- areDeepEqual
- areLengthEqualwen
- areSame
- haveSameKeys
- areShallowEqual
- areShallowEqualArray 📝 areShallowEqual 的子集（单独暴露出来也没啥用，应该直接写在 areShallowEqual 文件中）
- areShallowEqualObject 📝 areShallowEqual 的子集（单独暴露出来也没啥用，应该直接写在 areShallowEqual 文件中）

- canSastifyAll 📝 从命名上看， 语义不够明确

- hasItem 📝 从语义上看，相似功能的几个函数要合并
- hasKey 📝 从语义上看，相似功能的几个函数要合并
- hasProperty 📝 从语义上看，相似功能的几个函数要合并

- inArray
- inEnum
- inRange

- isArray
- isBigint
- isBoolean
- isEmpty
- isEmptyArray
- isEmptyObject
- isEmptyString
- isExist
- isFalse
- isFalsy
- isFunction
- isIndex
- isInterger
- isIterable
- isKey
- isNull
- isNullish
- isNumber
- isNumberString
- isObject
- isObjectLikeOrFunction 📝canAttachProperty?
- isObjectOrArray
- isOneof
- isPrimitive
- isString
- isSybol
- isTextNode📝 乱入，这应该是跟 DOM 相关的 judger， 放在这儿，不合适，不够纯粹
- isTrue
- isTruthy
- isUndefined
- notDefined
- notEmpty
- notEmptyObject 📝 给人感觉就是 notEmpty
- notExist
- notNullish
- notUndefined

## magic

- addDefault
- assert
- create
- fall
- parallelIf
- parallelSwitch
- shrinkToValue📝bonsai 里经常用， 说明它的细粒度很合适
- tryCatch

## math

- calcHypotenuse📝？？
- clamp
- formatNumber
- getDistance
- staySameSign
- sum

## object

- cleanObject 📝 显然是对应于 cleanArray，说明是相同目的， 可以合并了
- clearObjectUndefined📝 这是什么奇怪的方法？
- deepClone
- divide
- extractProperty
- fromEnties
- getObjectSize 📝 这是不是本就不符合 JavaScript 语义
- getObjectType
- getProperty
- insertEntries
- insertProperties
- kickByPropertyNames
- mapValues
- mergeDeep
- mergeObjects
- mergeShallow
- objectFilter
- objectMap
- objectReduce
- objectSafelyGet 📝 说明这是个试图用 key 表示路径的 object, 命名为 PathObject
- omit
- pick
- produce
- renameObjectKeys
- splitObject

## string

- changeCase
- componseStringArrays
- deepJSONParse
- getFirstChar
- getMatches
- randomCreateId

_mergeObjects 📝不属于任何编制