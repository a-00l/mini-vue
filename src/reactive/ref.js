import { hasChanged, isObject } from "../utils/index.js";
import { track, trigger } from "./effect.js";
import { reactive } from "./reactive.js";

export function ref(value) {
  // 是ref，返回当前值
  if (isRef(value)) {
    return value
  }

  return new RefImpl(value)
}

// 是否是Ref
export function isRef(value) {
  return !!(value && value.__Ref)
}

class RefImpl {

  constructor(value) {
    // 记录是否为ref
    this.__Ref = true
    // ref的值
    this._value = convert(value)
  }

  get value() {
    // 记录副作用
    track(this, 'value')
    return this._value
  }

  set value(newValue) {
    if (hasChanged(this._value, newValue)) {
      this._value = convert(newValue)
      // 触发副作用
      trigger(this, 'value')
      return this._value
    }
  }
}

// 如果传入对象，则使用reactive包裹，否则直接返回
function convert(target) {
  return isObject(target) ? reactive(target) : target
}