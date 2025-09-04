import { capitalize } from "../utils/index.js";
import { NodeTypes } from "./index.js";

export function generate(ast) {
  const ats = traversNode(ast)
  const code = `
  with(ctx) {
    const { h,Text} = MiniVue
    return ${ats}
  }
  `
  return code
}

function traversNode(node) {
  switch (node.type) {
    case NodeTypes.ROOT:
      // 只有一个根节点
      if (node.children.length === 1) {
        traversNode(node.children[0])
      }

      // 有多个根节点
      return traverseChildren(node)
    case NodeTypes.ELEMENT:
      // 创建元素
      return resolveElementATSNode(node)
    case NodeTypes.INTERPOLATION:
      // 创建指令节点
      return createTextNode(node.content)
    case NodeTypes.TEXT:
      // 创建文本节点
      return createTextNode(node)
  }
}

function resolveElementATSNode(node) {
  const forNode = pluck(node.directives, 'for')
  console.log(node);

  if (forNode) {
    const exp = forNode.exp

    // 分离(item, index) in items
    const [args, source] = exp.content.split(/\sin\s|\sof\s/)
    return `h(Fragment, null, renderList(${source}, ${args} => h('${node.tag}', null,${traverseChildren(node)}})))`
  }

  return createElementNode(node)
}

function pluck(directives, name, remove = true) {
  // 寻找指令
  const index = directives.findIndex(item => item.name === name)
  // 保存指令
  const dir = directives[index]
  if (index > -1 && remove) {
    // 删除该指令
    // directives.splice(index, 1)
  }

  return dir
}

function createTextNode(node) {
  const child = createText(node)
  return `h(Text, null, ${child})`
}

function createElementNode(node) {
  const { children } = node
  // 解析属性：将属性放在数组中
  const propArr = createPropsArr(node)
  // 将数组的转为对象
  const propStr = propArr.length ? `{${propArr.join(',')}}` : 'null'
  if (!children.length) {
    // 没有属性
    if (propStr === 'null') {
      return `h('${node.tag}')`
    }

    return `h('${node.tag}', 'null',${propArr})`
  }

  const results = traverseChildren(node)
  return `h('${node.tag}', ${propStr}, ${results})`
}

// v-if='123'
function createPropsArr(node) {
  const { props, directives } = node
  return [
    ...props.map(prop => `${prop.name}:${createText(prop.value)}`),
    ...directives.map(dir => {
      switch (dir.name) {
        case 'bind':
          // 使用v-bind绑定动态属性：:class="myClass"
          // class: 'myClass'
          return `${dir.arg.content}: ${createText(dir.exp)}`
        case 'on':
          const eventName = capitalize(dir.arg.content)
          const exp = dir.exp.content
          // 例子: <div @click="fun()"></div>
          // 如上情况需解析为onClick="($event) => fun()"
          if (/\([^)]*\)$/.test(exp) && !exp.includes('=>')) {
            return `$event => (${exp})`
          }

          return `on${eventName}: ${exp}`
        case 'html':
          // 使用v-html指令: v-html="myHtml" 
          // innerHTML: 'myHtml'
          return `innerHTML: ${dir.exp.content}`
      }
    })
  ]
}

function traverseChildren(node) {
  const { children } = node
  if (children.length === 1) {
    const child = children[0]
    if (child.type === NodeTypes.TEXT) {
      return createText(child)
    } else if (child.type === NodeTypes.DIRECTIVE) {
      return createText(child.content)
    }
  }

  const results = []
  for (let i = 0; i < children.length; i++) {
    results.push(traversNode(children[i]))
  }

  return `[${results.join(', ')}]`
}

function createText({ isStatic = true, content }) {
  return isStatic ? JSON.stringify(content) : content
}