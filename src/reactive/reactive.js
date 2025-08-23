import { isObject } from "../utils/isObject.js";
import { track, trigger } from "./effect.js";

export function reactive(target) {
  // 不是对象，返回原来值
  if (!isObject) {
    return target
  }

  return new Proxy(target, {
    get(target, key, receiver) {
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