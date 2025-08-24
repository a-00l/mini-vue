import { isObject } from "../utils/index.js";
import { track, trigger } from "./effect.js";

export function reactive(target) {
  // 不是对象，返回原来值
  if (!isObject) {
    return target
  }

  // 如果被代理的是reactive，则返回原来的值
  if (isReactive) {
    return target
  }

  return new Proxy(target, {
    get(target, key, receiver) {
      if (key === '__isReactive') {
        return true
      }

      // 收集effect
      track(target, key)
      return Reflect.get(target, key, receiver)
    },
    set(target, key, value, receiver) {
      // 更新值
      const res = Reflect.set(target, key, value, receiver)
      // 触发effect
      trigger(target, key)
      return res
    }
  })
}

// 如果target已经被代理了，那么执行target.__isReactive则会被get捕获
function isReactive(target) {
  return !!(target && target.__isReactive)
}