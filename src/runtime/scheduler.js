// 任务队列
const queue = []
const resolvePromise = Promise.resolve()
let currentFlushPromise = null
let isFlush = false
export function nextTick(fn) {
  const p = currentFlushPromise || resolvePromise
  return p.then(fn)
}

export function queueJob(job) {
  // 任务入数组
  if (!queue.length || !queue.includes(job)) {
    queue.push(job)
    // 清空任务
    queueFlush()
  }
}

function queueFlush() {
  if (!isFlush) {
    isFlush = true
    // 记录
    currentFlushPromise = resolvePromise.then(flushJobs)
  }
}

function flushJobs() {
  try {
    // 执行任务
    queue.forEach(job => job())
  } finally {
    // 初始化
    isFlush = false
    queue.length = 0
    currentFlushPromise = null
  }
}