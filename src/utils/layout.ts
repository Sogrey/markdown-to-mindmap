/**
 * 思维导图布局算法
 * 计算每个节点的坐标位置
 * 优化：父子节点居中对齐，连线更美观
 */

import type { MindmapNode, LayoutNode, LayoutResult, LayoutDirection } from '@/types/mindmap'

// 布局常量
const MIN_NODE_WIDTH = 80   // 最小节点宽度
const MAX_NODE_WIDTH = 300  // 最大节点宽度
const NODE_HEIGHT = 44
const HORIZONTAL_GAP = 50 // 水平方向节点间距（父子之间）
const VERTICAL_GAP = 16 // 垂直方向节点间距（同级之间）
const PADDING = 60 // 边距
const CHAR_WIDTH = 14 // 每个字符的预估宽度（像素）

/**
 * 根据文本长度计算节点宽度
 */
function calculateNodeWidth(text: string): number {
  // 计算文本宽度（考虑中英文混合）
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const otherChars = text.length - chineseChars
  const textWidth = chineseChars * CHAR_WIDTH + otherChars * (CHAR_WIDTH * 0.6)

  // 加上左右内边距
  const width = Math.ceil(textWidth) + 40

  // 限制在最小和最大宽度之间
  return Math.max(MIN_NODE_WIDTH, Math.min(MAX_NODE_WIDTH, width))
}

// 折叠节点集合（从外部传入）
let collapsedNodeIds: Set<string> = new Set()

/**
 * 设置折叠状态
 */
export function setCollapsedNodes(nodeIds: Set<string>): void {
  collapsedNodeIds = nodeIds
}

/**
 * 检查节点是否折叠
 */
export function isNodeCollapsed(nodeId: string): boolean {
  return collapsedNodeIds.has(nodeId)
}

/**
 * 计算布局
 */
export function calculateLayout(
  treeData: MindmapNode | null,
  direction: LayoutDirection = 'horizontal',
  collapsed: Set<string> = new Set()
): LayoutResult {
  // 更新折叠状态
  collapsedNodeIds = collapsed

  if (!treeData) {
    return { nodes: [], lines: [], width: 0, height: 0 }
  }

  // 计算每个节点的位置
  const nodes: LayoutNode[] = []
  const lines: Array<{ from: LayoutNode; to: LayoutNode }> = []

  if (direction === 'horizontal') {
    // 水平布局：根节点在左侧，子节点向右展开
    calculateHorizontalLayout(treeData, nodes, lines, PADDING, PADDING)
  } else {
    // 垂直布局：根节点在顶部，子节点向下展开
    calculateVerticalLayout(treeData, nodes, lines, PADDING, PADDING)
  }

  // 计算画布尺寸
  let minX = Infinity
  let minY = Infinity
  let maxX = 0
  let maxY = 0
  nodes.forEach((node) => {
    minX = Math.min(minX, node.x)
    minY = Math.min(minY, node.y)
    maxX = Math.max(maxX, node.x + node.width)
    maxY = Math.max(maxY, node.y + node.height)
  })

  return {
    nodes,
    lines,
    width: maxX + PADDING,
    height: maxY + PADDING,
  }
}

/**
 * 水平布局计算
 * 同级子节点左对齐，垂直居中分布
 */
function calculateHorizontalLayout(
  node: MindmapNode,
  nodes: LayoutNode[],
  lines: Array<{ from: LayoutNode; to: LayoutNode }>,
  x: number,
  y: number,
  parentNode: LayoutNode | null = null
): void {
  // 计算当前节点宽度（根据文本长度）
  const nodeWidth = calculateNodeWidth(node.text)

  // 创建节点数据
  const nodeData: LayoutNode = {
    id: node.id,
    text: node.text,
    note: node.note,  // 复制备注字段
    x,
    y,
    width: nodeWidth,
    height: NODE_HEIGHT,
    isRoot: !parentNode,
    collapsed: collapsedNodeIds.has(node.id),
  }
  nodes.push(nodeData)

  // 绘制从父节点到当前节点的连线
  if (parentNode) {
    lines.push({
      from: parentNode,
      to: nodeData,
    })
  }

  // 如果没有子节点或节点已折叠，停止
  if (!node.children || node.children.length === 0 || collapsedNodeIds.has(node.id)) {
    return
  }

  // 计算子节点的总高度
  let totalChildHeight = 0
  const childHeights: number[] = []
  for (const child of node.children) {
    const h = calculateSubtreeHeight(child)
    childHeights.push(h)
    totalChildHeight += h
  }
  totalChildHeight += (node.children.length - 1) * VERTICAL_GAP

  // 当前节点和子树的垂直中心对齐
  const nodeCenterY = y + NODE_HEIGHT / 2
  const subtreeTopY = nodeCenterY - totalChildHeight / 2

  // 子节点 X 位置：父节点右边缘 + 间距
  const childX = x + nodeWidth + HORIZONTAL_GAP

  // 计算每个子节点的位置
  let currentY = subtreeTopY

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i]
    const childHeight = childHeights[i]

    // 子节点 Y 位置：垂直居中对齐
    const childY = currentY + childHeight / 2 - NODE_HEIGHT / 2

    calculateHorizontalLayout(
      child,
      nodes,
      lines,
      childX,
      childY,
      nodeData
    )

    currentY += childHeight + VERTICAL_GAP
  }
}

/**
 * 垂直布局计算
 * 同级子节点相对于父节点居中对齐
 */
function calculateVerticalLayout(
  node: MindmapNode,
  nodes: LayoutNode[],
  lines: Array<{ from: LayoutNode; to: LayoutNode }>,
  x: number,
  y: number,
  parentNode: LayoutNode | null = null
): void {
  // 计算当前节点宽度（根据文本长度）
  const nodeWidth = calculateNodeWidth(node.text)

  // 创建节点数据
  const nodeData: LayoutNode = {
    id: node.id,
    text: node.text,
    note: node.note,  // 复制备注字段
    x,
    y,
    width: nodeWidth,
    height: NODE_HEIGHT,
    isRoot: !parentNode,
    collapsed: collapsedNodeIds.has(node.id),
  }
  nodes.push(nodeData)

  // 绘制从父节点到当前节点的连线
  if (parentNode) {
    lines.push({
      from: parentNode,
      to: nodeData,
    })
  }

  // 如果没有子节点或节点已折叠，停止
  if (!node.children || node.children.length === 0 || collapsedNodeIds.has(node.id)) {
    return
  }

  // 子节点 Y 位置：父节点下方 + 间距
  const childY = y + NODE_HEIGHT + VERTICAL_GAP

  // 计算子节点的总宽度
  let totalChildWidth = 0
  const childWidths: number[] = []
  for (const child of node.children) {
    const w = calculateNodeWidth(child.text)
    childWidths.push(w)
    totalChildWidth += w
  }
  totalChildWidth += (node.children.length - 1) * HORIZONTAL_GAP

  // 子树相对于父节点居中
  const nodeCenterX = x + nodeWidth / 2
  const subtreeLeftX = nodeCenterX - totalChildWidth / 2

  // 计算每个子节点的位置
  let currentX = subtreeLeftX

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i]

    calculateVerticalLayout(
      child,
      nodes,
      lines,
      currentX,
      childY,
      nodeData
    )

    currentX += childWidths[i] + HORIZONTAL_GAP
  }
}

/**
 * 计算子树占据宽度（水平布局：累加子节点；垂直布局：取最大）
 * @param node 节点
 * @param direction 布局方向
 */
export function calculateSubtreeWidth(node: MindmapNode, direction: LayoutDirection = 'horizontal'): number {
  // 如果节点被折叠或没有子节点，只返回自身宽度
  if (collapsedNodeIds.has(node.id) || !node.children || node.children.length === 0) {
    return calculateNodeWidth(node.text)
  }

  if (direction === 'horizontal') {
    // 水平布局：累加所有子节点占据宽度
    let totalWidth = 0
    for (const child of node.children) {
      totalWidth += calculateSubtreeWidth(child, direction)
    }
    totalWidth += (node.children.length - 1) * HORIZONTAL_GAP
    return Math.max(calculateNodeWidth(node.text), totalWidth)
  } else {
    // 垂直布局：取最大子节点占据宽度
    let maxWidth = 0
    for (const child of node.children) {
      const childWidth = calculateSubtreeWidth(child, direction)
      maxWidth = Math.max(maxWidth, childWidth)
    }
    maxWidth += HORIZONTAL_GAP
    return Math.max(calculateNodeWidth(node.text), maxWidth)
  }
}

/**
 * 计算子树占据高度
 */
function calculateSubtreeHeight(node: MindmapNode): number {
  // 如果节点被折叠或没有子节点，只返回自身高度
  if (collapsedNodeIds.has(node.id) || !node.children || node.children.length === 0) {
    return NODE_HEIGHT
  }

  let totalHeight = 0
  for (const child of node.children) {
    totalHeight += calculateSubtreeHeight(child)
  }
  totalHeight += (node.children.length - 1) * VERTICAL_GAP

  return Math.max(NODE_HEIGHT, totalHeight)
}
