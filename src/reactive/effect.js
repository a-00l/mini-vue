let activeEffect;
export function effect(fn) {
  const effectFn = () => {
    try {
      // 收集effect
      activeEffect = effectFn
      fn()
    } finally {
      // TODO：错误处理
      activeEffect = null
    }
  }

  effectFn()
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
    effectFn()
  });
}