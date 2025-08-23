import { effect } from "./reactive/effect.js";
import { reactive } from "./reactive/reactive.js";
const state = reactive({
  count: 0
})

window.state = state
effect(() => {
  console.log('调用：' + state.count);
})