import { effect, track, trigger } from "./effect.js"

export function computed(getter) {
  return new computedImpl(getter)
}

class computedImpl {
  constructor(getter) {
    this._value = null
    this._dirty = true
    this.effect = effect(getter, {
      lazy: true,
      scheduler: () => {
        this._dirty = true
        trigger(this, 'value')
      }
    })
  }

  get value() {
    if (this._dirty) {
      this._value = this.effect()
      this._dirty = false
      track(this, 'value')
    }

    return this._value
  }

  set value(newValue) {
    console.error('computed属性不能被修改');
  }
}