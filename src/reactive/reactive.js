import { hasChanged, isArray, isObject } from "../utils/index.js";
import { track, trigger } from "./effect.js";

// 用来记录被代理了的对象
const proxyMap = new WeakMap()
export function reactive(target) {
  // 不是对象，返回原来值
  if (!isObject(target)) {
    return target
  }

  // 如果被代理的是reactive，则返回原来的值
  if (isReactive(target)) {
    return target
  }

  // 如果对象已经被代理了，则返回该对象
  if (proxyMap.has(target)) {
    return proxyMap.get(target)
  }

  const proxy = new Proxy(target, {
    get(target, key, receiver) {
      if (key === '__isReactive') {
        return true
      }

      const res = Reflect.get(target, key, receiver)
      // 收集effect
      track(target, key)
      return isObject(res) ? reactive(res) : res
    },
    set(target, key, value, receiver) {
      const oldValue = target[key]
      const oldLenght = target.length
      // 更新值
      const res = Reflect.set(target, key, value, receiver)
      // 3.与原来值不一样再触发effect
      if (hasChanged(oldValue, value)) {
        // 触发effect
        trigger(target, key)
        // 5.处理数组中的方法（只实现了一种，其他类似：push、pop）
        if (isArray(target) && hasChanged(oldLenght, target[key])) {
          trigger(target, 'length')
        }
      }

      return res
    }
  })

  // 记录proxy
  proxyMap.set(target, proxy)
  return proxy
}

// 如果target已经被代理了，那么执行target.__isReactive则会被get捕获
function isReactive(target) {
  return !!(target && target.__isReactive)
}