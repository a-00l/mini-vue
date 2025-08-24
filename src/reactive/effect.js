let activeEffect;
const effectStack = []
export function effect(fn, options = {}) {
  const effectFn = () => {
    try {
      // 收集effect
      activeEffect = effectFn
      effectStack.push(activeEffect)

      return fn()
    } finally {
      effectStack.pop()
      activeEffect = effectStack[effectStack.length - 1]
    }
  }

  // computed执行
  if (!options.lazy) {
    effectFn()
  }

  // 记录computed中的调度器
  effectFn.scheduler = options.scheduler
  return effectFn
}

const targetMap = new WeakMap()
// 收集依赖
export function track(target, key) {
  if (!activeEffect) {
    return
  }

  // 获取对应target
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    // 没有target，则创建
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }

  // 获取对应key
  let dep = depsMap.get(key)
  if (!dep) {
    // 没有key，则创建
    dep = new Set()
    depsMap.set(key, dep)
  }

  // 收集依赖
  dep.add(activeEffect)
}

// 触发依赖
export function trigger(target, key) {
  // 找不到依赖，则return
  const depsMap = targetMap.get(target)
  if (!depsMap) {
    return
  }

  const dep = depsMap.get(key)
  if (!dep) {
    return
  }

  // 触发依赖
  dep.forEach(effectFn => {
    if (effectFn.scheduler) {
      // 触发computed调度器
      effectFn.scheduler(effectFn)
    } else {
      effectFn()
    }
  });
}