import { capitalize } from "../utils/index.js";
import { NodeTypes } from "./index.js";

export function generate(ast) {
  const ats = traversNode(ast)

  const code = `
    with(ctx) {
    const { h,Text,Fragment, renderList, resolveComponent} = MiniVue
    return ${ats}
  }`

  return code
}

function traversNode(node, parent) {
  switch (node.type) {
    case NodeTypes.ROOT:
      // 只有一个根节点
      if (node.children.length === 1) {
        return traversNode(node.children[0], node)
      }

      // 有多个根节点
      return traverseChildren(node)
    case NodeTypes.ELEMENT:
      // 创建元素
      return resolveElementATSNode(node, parent)
    case NodeTypes.INTERPOLATION:
      // 创建指令节点
      return createTextNode(node.content)
    case NodeTypes.TEXT:
      // 创建文本节点
      return createTextNode(node)
  }
}

function resolveElementATSNode(node, parent) {
  const vModel = pluck(node.directives, 'model');

  if (vModel) {
    node.directives.push(
      {
        type: NodeTypes.DIRECTIVE,
        name: 'bind',
        exp: vModel.exp, // 表达式节点
        arg: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: 'value',
          isStatic: true,
        }, // 表达式节点
      },
      {
        type: NodeTypes.DIRECTIVE,
        name: 'on',
        exp: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: `($event) => ${vModel.exp.content} = $event.target.value`,
          isStatic: false,
        }, // 表达式节点
        arg: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: 'input',
          isStatic: true,
        }, // 表达式节点
      }
    );
  }

  // 处理if
  const ifNode = pluck(node.directives, 'if') || pluck(node.directives, 'else-if')
  if (ifNode) {
    const condition = ifNode.exp.content
    let consequent = resolveElementATSNode(node, parent)
    let alternate = createTextNode()
    // 处理else
    const { children } = parent
    // 寻找到if的位置
    const ifIndex = children.findIndex(item => item === node) + 1
    for (let i = ifIndex; i < children.length; i++) {
      const sibling = children[i]
      // 下一个节点是空节点则删除
      if (sibling.type === NodeTypes.TEXT && !sibling.content.trim()) {
        children.splice(i, 1)
        i--
        continue
      }

      if (sibling.type === NodeTypes.ELEMENT) {
        // 如果下一个节点是else
        if (pluck(sibling.directives, 'else') || pluck(sibling.directives, 'else-if', false)) {
          alternate = resolveElementATSNode(sibling, parent)
          // 删除该子节点
          children.splice(i, 1)
        }

        break
      }
    }

    return `${condition} ? ${consequent} : ${alternate}`
  }

  const forNode = pluck(node.directives, 'for')
  if (forNode) {
    const exp = forNode.exp
    // 分离(item, index) in items
    const [args, source] = exp.content.split(/\sin\s|\sof\s/)
    return `h(Fragment, null, renderList(${source.trim()}, ${args.trim()} => ${resolveElementATSNode(node, parent)}))`
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
    directives.splice(index, 1)
  }

  return dir
}

function createTextNode(node) {
  const child = createText(node)
  return `h(Text, null, ${child})`
}

function createElementNode(node) {
  const { children, tagType } = node
  console.log(node);
  const tag = tagType === NodeTypes.ELEMENT ? `'${node.tag}'` : `resolveComponent("${node.tag}")`
  // 解析属性：将属性放在数组中
  const propArr = createPropsArr(node)
  // 将数组的转为对象
  const propStr = propArr.length ? `{${propArr.join(',')}}` : 'null'
  if (!children.length) {
    // 没有属性
    if (propStr === 'null') {
      return `h(${tag})`
    }

    return `h(${tag},{${propArr}})`
  }

  const results = traverseChildren(node)
  return `h(${tag}, ${propStr}, ${results})`
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
    results.push(traversNode(children[i], node))
  }

  return `[${results.join(', ')}]`
}

function createText({ isStatic = true, content = '' } = {}) {
  return isStatic ? JSON.stringify(content) : content
}