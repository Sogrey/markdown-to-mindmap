<template>
  <div
    class="mindmap-container"
    ref="containerRef"
    @wheel.prevent="handleWheel"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseUp"
    @contextmenu.prevent="handleContextMenu"
  >
    <!-- 禁用文字选择 -->
    <svg
      ref="svgRef"
      class="mindmap-svg"
      :viewBox="viewBox"
      @mousedown.stop="handleSvgMouseDown"
    >
      <defs>
        <!-- 箭头标记 -->
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="var(--line-color)" />
        </marker>

        <!-- 节点阴影 -->
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.15" />
        </filter>
      </defs>

      <!-- 连线层 -->
      <g class="lines">
        <path
          v-for="(line, index) in layout.lines"
          :key="`line-${index}`"
          :d="getLinePath(line)"
          fill="none"
          stroke="var(--line-color)"
          stroke-width="2"
          stroke-linecap="round"
          class="connection-line"
        />
      </g>

      <!-- 节点层 -->
      <g class="nodes">
        <g
          v-for="node in layout.nodes"
          :key="node.id"
          :transform="`translate(${node.x}, ${node.y})`"
          class="node-group"
          :class="{ 'is-root': node.isRoot }"
          :data-node-id="node.id"
        >
          <!-- 节点背景 -->
          <g
            class="node"
            :class="{ editing: editingNode?.id === node.id }"
            @click="editingNode?.id !== node.id && handleNodeClick(node)"
            @dblclick="editingNode?.id !== node.id && handleNodeDoubleClick(node)"
          >
            <rect
              :width="node.width"
              :height="node.height"
              :rx="node.isRoot ? 12 : 8"
              :fill="node.isRoot ? 'var(--root-bg)' : 'var(--node-bg)'"
              :stroke="node.isRoot ? 'var(--root-bg)' : 'var(--node-border)'"
              stroke-width="2"
              class="node-rect"
            />

            <!-- 节点文字 -->
            <foreignObject
              :width="node.width - 16"
              :height="node.height"
              :x="8"
              :y="0"
              class="node-content"
            >
              <div
                class="node-text"
                :class="{ 'root-text': node.isRoot }"
                :style="{
                  color: node.isRoot ? 'var(--root-text)' : 'var(--node-text)',
                }"
              >
                <span v-if="editingNode?.id !== node.id">{{ node.text }}</span>
                <input
                  v-else
                  ref="nodeInputRef"
                  v-model="editingText"
                  class="node-edit-input"
                  @blur="finishEdit"
                  @keydown.enter.prevent="finishEdit"
                  @keydown.esc.prevent="cancelEdit"
                  @click.stop
                />
              </div>
            </foreignObject>

            <!-- 备注标识 -->
            <g
              v-if="hasNote(node.id, node.note) && editingNode?.id !== node.id"
              :transform="`translate(${node.width - 20}, -8)`"
              class="note-indicator"
              @click.stop="toggleNoteDisplay(node.id)"
            >
              <circle cx="8" cy="8" r="8" fill="#fbbf24" />
              <text x="8" y="12" text-anchor="middle" font-size="10">📝</text>
            </g>
          </g>

          <!-- 备注显示 -->
            <g
              v-if="showNotes[node.id] && hasNote(node.id, node.note) && editingNode?.id !== node.id"
              :transform="`translate(0, ${node.height + 4})`"
              class="note-container"
              @click.stop
            >
            <rect
              :width="node.width"
              :height="getNoteHeight(node.note || '')"
              rx="4"
              fill="#fef3c7"
              stroke="#fbbf24"
              stroke-width="1"
            />
            <foreignObject
              :width="node.width - 8"
              :height="getNoteHeight(node.note || '')"
              x="4"
              y="4"
              class="note-content"
            >
              <div class="note-text">{{ node.note }}</div>
            </foreignObject>
          </g>

          <!-- 折叠/展开按钮（节点右侧） -->
          <g
            v-if="hasChildren(node.id) && editingNode?.id !== node.id"
            :transform="`translate(${node.width + 4}, ${node.height / 2 - 10})`"
            class="node-btn collapse-btn"
            :class="{ collapsed: isCollapsed(node.id) }"
            @click.stop="handleToggleCollapse(node)"
          >
            <circle cx="10" cy="10" r="10" fill="var(--node-border)" />
            <text x="10" y="15" text-anchor="middle" fill="white" font-size="14" font-weight="bold">
              {{ isCollapsed(node.id) ? '+' : '−' }}
            </text>
          </g>

          <!-- 添加子节点按钮（节点右边，没有子节点时显示） -->
          <g
            v-if="!hasChildren(node.id) && editingNode?.id !== node.id"
            :transform="`translate(${node.width + 4}, ${node.height / 2 - 10})`"
            class="node-btn add-btn"
            @click.stop="handleAddChild(node)"
          >
            <circle cx="10" cy="10" r="10" fill="var(--root-bg)" />
            <text x="10" y="15" text-anchor="middle" fill="white" font-size="14" font-weight="bold">
              +
            </text>
          </g>
        </g>
      </g>
    </svg>

    <!-- 右键菜单 -->
    <ContextMenu
      :visible="showContextMenu"
      :position="contextMenuPosition"
      :node-text="contextMenuNode?.text || ''"
      :has-children="contextMenuNode ? hasChildren(contextMenuNode.id) : false"
      :is-collapsed="contextMenuNode ? isCollapsed(contextMenuNode.id) : false"
      :has-note="contextMenuNode ? hasNote(contextMenuNode.id) : false"
      :is-root="contextMenuNode?.isRoot || false"
      @action="handleContextMenuAction"
      @close="showContextMenu = false"
    />

    <!-- 添加备注弹窗 -->
    <div v-if="showNoteModal" class="modal-overlay" @click.self="closeNoteModal">
      <div class="modal-content note-modal">
        <h3>{{ editingNoteNode ? '编辑备注' : '添加备注' }}</h3>
        <textarea
          ref="noteTextareaRef"
          v-model="noteText"
          placeholder="输入备注内容..."
          rows="4"
        ></textarea>
        <div class="modal-actions">
          <button class="btn-cancel" @click="closeNoteModal">取消</button>
          <button class="btn-confirm" @click="confirmNote">确定</button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!treeData" class="empty-state">
      <p>请在左侧输入 Markdown 内容</p>
    </div>

    <!-- 缩放控制 -->
    <div class="zoom-hint">
      <span>{{ Math.round(zoom * 100) }}%</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useMindmapStore } from '../../stores/mindmap'
import { calculateLayout } from '../../utils/layout'
import ContextMenu from './ContextMenu.vue'
import type { MindmapNode, LayoutNode, LayoutResult, ContextMenuAction } from '@/types/mindmap'

const props = defineProps<{
  treeData: MindmapNode | null
}>()

const emit = defineEmits<{
  nodeClick: [node: LayoutNode]
  addChild: [node: LayoutNode]
  toggleCollapse: [node: LayoutNode]
  editNode: [nodeId: string, newText: string]
  deleteNode: [nodeId: string]
  addNote: [nodeId: string, note: string]
  updateNote: [nodeId: string, note: string]
}>()

const store = useMindmapStore()

const containerRef = ref<HTMLDivElement | null>(null)
const svgRef = ref<SVGSVGElement | null>(null)

// 缩放和平移状态（使用 store 的状态）
const isPanning = ref<boolean>(false)
const panStart = ref<{ x: number; y: number }>({ x: 0, y: 0 })
const zoom = computed(() => store.zoomLevel)
const panOffset = computed(() => store.panOffset)

// 拖拽检测
const dragStart = ref<{ x: number; y: number; target: EventTarget | null } | null>(null)
const isDragging = ref<boolean>(false)
const DRAG_THRESHOLD = 5 // 拖拽阈值（像素）

// 节点编辑状态
const editingNode = ref<LayoutNode | null>(null)
const editingText = ref<string>('')
const nodeInputRef = ref<HTMLInputElement[]>([])
let lastClickTime = 0 // 上次点击时间
let lastClickNodeId = '' // 上次点击的节点ID

// 右键菜单状态
const showContextMenu = ref<boolean>(false)
const contextMenuPosition = ref<{ x: number; y: number }>({ x: 0, y: 0 })
const contextMenuNode = ref<LayoutNode | null>(null)

// 备注状态
const showNotes = ref<Record<string, boolean>>({})
const showNoteModal = ref<boolean>(false)
const noteText = ref<string>('')
const editingNoteNode = ref<LayoutNode | null>(null)
const noteTextareaRef = ref<HTMLTextAreaElement | null>(null)

// 节点备注缓存
const nodeNotes = ref<Record<string, string>>({})

// 计算布局
const layout = computed<LayoutResult>(() => {
  if (!props.treeData) {
    return { nodes: [], lines: [], width: 800, height: 600 }
  }

  const baseLayout = calculateLayout(props.treeData, store.layoutDirection, store.collapsedNodes)

  // 更新节点备注信息：优先使用 nodeNotes（右键添加的备注），其次使用 node.note（从 layout.ts 复制的备注）
  baseLayout.nodes = baseLayout.nodes.map((node) => ({
    ...node,
    note: nodeNotes.value[node.id] !== undefined ? nodeNotes.value[node.id] : node.note,
    showNote: showNotes.value[node.id] || false,
  }))

  return baseLayout
})

// 计算备注高度
function getNoteHeight(note: string): number {
  const lines = note.split('\n').length
  const charPerLine = 20
  const estimatedLines = Math.ceil(note.length / charPerLine)
  return Math.max(30, Math.min(120, Math.max(lines, estimatedLines) * 20 + 8))
}

// 计算 viewBox
const viewBox = computed<string>(() => {
  const { width, height } = layout.value
  const padding = 50
  return `${(-panOffset.value.x) / zoom.value - padding} ${(-panOffset.value.y) / zoom.value - padding} ${(width + padding * 2) / zoom.value} ${(height + padding * 2) / zoom.value}`
})

// 查找节点
function findNode(node: MindmapNode, id: string): MindmapNode | null {
  if (node.id === id) return node
  if (node.children) {
    for (const child of node.children) {
      const found = findNode(child, id)
      if (found) return found
    }
  }
  return null
}

// 检查节点是否有子节点
function hasChildren(nodeId: string): boolean {
  if (!props.treeData) return false
  const node = findNode(props.treeData, nodeId)
  return !!(node && node.children && node.children.length > 0)
}

// 检查节点是否有备注（支持 nodeNotes 和 node.note）
function hasNote(nodeId: string, note?: string): boolean {
  return !!(nodeNotes.value[nodeId] || note)
}

// 检查节点是否折叠
function isCollapsed(nodeId: string): boolean {
  return store.isCollapsed(nodeId)
}

// 获取连线路径
function getLinePath(line: { from: LayoutNode; to: LayoutNode }): string {
  const from = line.from
  const to = line.to

  let startX: number, startY: number, endX: number, endY: number

  if (store.layoutDirection === 'horizontal') {
    // 水平布局：从父节点右侧中心到子节点左侧中心
    startX = from.x + from.width
    startY = from.y + from.height / 2
    endX = to.x
    endY = to.y + to.height / 2
  } else {
    // 垂直布局：从父节点底部中心到子节点顶部中心
    startX = from.x + from.width / 2
    startY = from.y + from.height
    endX = to.x + to.width / 2
    endY = to.y
  }

  const controlOffset = store.layoutDirection === 'horizontal'
    ? Math.min(50, Math.abs(endX - startX) / 2)
    : Math.min(50, Math.abs(endY - startY) / 2)

  return `M ${startX} ${startY} C ${startX + (store.layoutDirection === 'horizontal' ? controlOffset : 0)} ${startY + (store.layoutDirection === 'vertical' ? controlOffset : 0)}, ${endX - (store.layoutDirection === 'horizontal' ? controlOffset : 0)} ${endY - (store.layoutDirection === 'vertical' ? controlOffset : 0)}, ${endX} ${endY}`
}

// 鼠标滚轮缩放（以鼠标位置为中心）
function handleWheel(e: WheelEvent): void {
  if (!containerRef.value || !svgRef.value) return

  const svgRect = svgRef.value.getBoundingClientRect()

  // 鼠标相对于 SVG 元素的坐标
  const mouseX = e.clientX - svgRect.left
  const mouseY = e.clientY - svgRect.top

  // 获取当前布局尺寸
  const { width: layoutWidth, height: layoutHeight } = layout.value
  const padding = 50

  // 当前 viewBox 的尺寸（像素/单位比例）
  const viewBoxWidth = (layoutWidth + padding * 2) / zoom.value
  const viewBoxHeight = (layoutHeight + padding * 2) / zoom.value

  // SVG 元素尺寸
  const svgWidth = svgRect.width
  const svgHeight = svgRect.height

  // 计算 viewBox 原点
  const viewBoxOriginX = (-panOffset.value.x) / zoom.value - padding
  const viewBoxOriginY = (-panOffset.value.y) / zoom.value - padding

  // 鼠标在视图坐标中的位置
  // 屏幕坐标 -> SVG 坐标 -> 视图坐标
  const viewX = (mouseX / svgWidth) * viewBoxWidth + viewBoxOriginX
  const viewY = (mouseY / svgHeight) * viewBoxHeight + viewBoxOriginY

  // 计算新的缩放级别
  const delta = e.deltaY > 0 ? -0.1 : 0.1
  const newZoom = Math.max(0.1, Math.min(3, store.zoomLevel + delta))

  // 新的 viewBox 尺寸
  const newViewBoxWidth = (layoutWidth + padding * 2) / newZoom
  const newViewBoxHeight = (layoutHeight + padding * 2) / newZoom

  // 保持鼠标位置不变，计算新的 viewBox 原点
  // viewX = (mouseX / svgWidth) * newViewBoxWidth + newViewBoxOriginX
  const newViewBoxOriginX = viewX - (mouseX / svgWidth) * newViewBoxWidth
  const newViewBoxOriginY = viewY - (mouseY / svgHeight) * newViewBoxHeight

  // 转换为 panOffset
  const newPanX = -(newViewBoxOriginX + padding) * newZoom
  const newPanY = -(newViewBoxOriginY + padding) * newZoom

  store.setZoom(newZoom)
  store.setPan(newPanX, newPanY)
}

// SVG 鼠标按下（统一使用拖拽检测）
function handleSvgMouseDown(e: MouseEvent): void {
  dragStart.value = { x: e.clientX, y: e.clientY, target: e.target }
  isDragging.value = false
}

function handleMouseDown(e: MouseEvent): void {
  dragStart.value = { x: e.clientX, y: e.clientY, target: e.target }
  isDragging.value = false
}

function handleMouseMove(e: MouseEvent): void {
  // 检测是否开始拖拽
  if (dragStart.value && !isDragging.value) {
    const dx = Math.abs(e.clientX - dragStart.value.x)
    const dy = Math.abs(e.clientY - dragStart.value.y)
    if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
      isDragging.value = true
      isPanning.value = true
      panStart.value = { x: e.clientX, y: e.clientY }
    }
  }

  if (isPanning.value) {
    const dx = e.clientX - panStart.value.x
    const dy = e.clientY - panStart.value.y
    store.setPan(
      store.panOffset.x + dx,
      store.panOffset.y + dy
    )
    panStart.value = { x: e.clientX, y: e.clientY }
  }
}

function handleMouseUp(): void {
  isPanning.value = false
  dragStart.value = null
  isDragging.value = false
}

// 节点点击
function handleNodeClick(node: LayoutNode): void {
  // 如果正在拖拽（平移），忽略节点点击
  if (isDragging.value) {
    return
  }

  // 如果正在编辑当前节点，保持编辑状态
  if (editingNode.value?.id === node.id) {
    return
  }

  // 检测双击：如果 300ms 内再次点击同一节点，可能是双击触发的 click 事件
  const now = Date.now()
  if (node.id === lastClickNodeId && now - lastClickTime < 300) {
    // 忽略双击触发的 click 事件
    lastClickTime = 0
    lastClickNodeId = ''
    return
  }
  lastClickTime = now
  lastClickNodeId = node.id

  // 如果正在编辑其他节点，取消编辑
  if (editingNode.value) {
    cancelEdit()
  }

  emit('nodeClick', node)
}

// 节点双击编辑
function handleNodeDoubleClick(node: LayoutNode): void {
  editingNode.value = node
  editingText.value = node.text
  nextTick(() => {
    const input = nodeInputRef.value[0]
    if (input) {
      input.focus()
      input.select()
    }
  })
}

// 完成编辑
function finishEdit(): void {
  if (editingNode.value && editingText.value.trim()) {
    emit('editNode', editingNode.value.id, editingText.value.trim())
  }
  editingNode.value = null
  editingText.value = ''
}

// 取消编辑
function cancelEdit(): void {
  editingNode.value = null
  editingText.value = ''
}

// 右键菜单
function handleContextMenu(e: MouseEvent): void {
  const target = e.target as HTMLElement
  const nodeGroup = target.closest('.node-group')

  if (nodeGroup) {
    // 从 node-group 获取节点 ID
    const nodeId = (nodeGroup as Element).getAttribute('data-node-id')
    const node = layout.value.nodes.find((n) => n.id === nodeId)

    if (node) {
      contextMenuNode.value = node
      contextMenuPosition.value = { x: e.clientX, y: e.clientY }
      showContextMenu.value = true
    }
  }
}

// 右键菜单操作
function handleContextMenuAction(action: ContextMenuAction): void {
  if (!contextMenuNode.value) return

  switch (action) {
    case 'edit':
      handleNodeDoubleClick(contextMenuNode.value)
      break
    case 'addChild':
      handleAddChild(contextMenuNode.value)
      break
    case 'toggleCollapse':
      store.toggleCollapse(contextMenuNode.value.id)
      break
    case 'delete':
      emit('deleteNode', contextMenuNode.value.id)
      break
    case 'addNote':
    case 'toggleNote':
      openNoteModal(contextMenuNode.value)
      break
    case 'divider':
      // 分隔线，无需处理
      break
  }

  showContextMenu.value = false
}

// 切换备注显示
function toggleNoteDisplay(nodeId: string): void {
  showNotes.value[nodeId] = !showNotes.value[nodeId]
}

// 打开备注弹窗
function openNoteModal(node: LayoutNode): void {
  editingNoteNode.value = node
  noteText.value = nodeNotes.value[node.id] || node.note || ''
  showNoteModal.value = true
  nextTick(() => {
    noteTextareaRef.value?.focus()
  })
}

// 关闭备注弹窗
function closeNoteModal(): void {
  showNoteModal.value = false
  noteText.value = ''
  editingNoteNode.value = null
}

// 确认备注
function confirmNote(): void {
  if (editingNoteNode.value) {
    const nodeId = editingNoteNode.value.id
    if (noteText.value.trim()) {
      nodeNotes.value[nodeId] = noteText.value.trim()
      showNotes.value[nodeId] = true
      emit('addNote', nodeId, noteText.value.trim())
    } else {
      delete nodeNotes.value[nodeId]
      showNotes.value[nodeId] = false
    }
  }
  closeNoteModal()
}

// 切换折叠
function handleToggleCollapse(node: LayoutNode): void {
  store.toggleCollapse(node.id)
}

// 添加子节点
function handleAddChild(node: LayoutNode): void {
  emit('addChild', node)
}

// 以屏幕中心为基准的缩放方法（供外部调用）
function zoomIn(): void {
  if (!containerRef.value) {
    store.setZoom(Math.min(3, store.zoomLevel + 0.1))
    return
  }

  const rect = containerRef.value.getBoundingClientRect()
  const screenCenterX = rect.width / 2
  const screenCenterY = rect.height / 2

  const viewX = (screenCenterX - panOffset.value.x) / zoom.value
  const viewY = (screenCenterY - panOffset.value.y) / zoom.value
  const newZoom = Math.min(3, store.zoomLevel + 0.1)

  store.setPan(screenCenterX - viewX * newZoom, screenCenterY - viewY * newZoom)
  store.setZoom(newZoom)
}

function zoomOut(): void {
  if (!containerRef.value) {
    store.setZoom(Math.max(0.1, store.zoomLevel - 0.1))
    return
  }

  const rect = containerRef.value.getBoundingClientRect()
  const screenCenterX = rect.width / 2
  const screenCenterY = rect.height / 2

  const viewX = (screenCenterX - panOffset.value.x) / zoom.value
  const viewY = (screenCenterY - panOffset.value.y) / zoom.value
  const newZoom = Math.max(0.1, store.zoomLevel - 0.1)

  store.setPan(screenCenterX - viewX * newZoom, screenCenterY - viewY * newZoom)
  store.setZoom(newZoom)
}

function resetView(): void {
  store.resetView()
}

// 暴露方法给父组件
defineExpose({
  svgRef,
  zoomIn,
  zoomOut,
  resetView,
  // 暴露布局尺寸，用于导出
  getLayoutSize: () => layout.value,
})
</script>

<style scoped>
.mindmap-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  background-color: #fafafa;
  background-image: radial-gradient(circle, #ddd 1px, transparent 1px);
  background-size: 20px 20px;
  /* 禁用文字选择 */
  user-select: none;
  -webkit-user-select: none;
}

.mindmap-svg {
  width: 100%;
  height: 100%;
  cursor: grab;
}

.mindmap-svg:active {
  cursor: grabbing;
}

.node-group {
  cursor: pointer;
}

.node {
  cursor: pointer;
}

.node:hover .node-rect {
  filter: url(#shadow);
}

.node-rect {
  transition: filter 0.2s;
}

.node-content {
  pointer-events: none;
  overflow: visible;
}

.node-text {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  line-height: 1.3;
  word-break: break-word;
  overflow: hidden;
}

.root-text {
  font-size: 15px;
  font-weight: 600;
}

.node-edit-input {
  width: 100%;
  border: none;
  background: transparent;
  font-size: 13px;
  outline: none;
  font-family: inherit;
  color: inherit;
}

.node-btn {
  cursor: pointer;
  transition: opacity 0.15s;
}

.node-btn:hover {
  opacity: 0.8;
}

.node-btn circle {
  transition: r 0.15s;
}

.node-btn:hover circle {
  r: 11;
}

.collapse-btn.collapsed circle {
  background: var(--line-color);
}

.note-indicator {
  cursor: pointer;
}

.note-indicator:hover {
  opacity: 0.8;
}

.note-container {
  cursor: default;
}

.note-content {
  pointer-events: none;
  overflow: hidden;
}

.note-text {
  font-size: 11px;
  line-height: 1.4;
  color: #78350f;
  word-break: break-word;
  white-space: pre-wrap;
}

.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #999;
  font-size: 16px;
  pointer-events: none;
}

.zoom-hint {
  position: absolute;
  bottom: 16px;
  right: 16px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
}

/* 备注弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 24px;
  border-radius: 12px;
  width: 320px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.note-modal textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  resize: vertical;
  font-family: inherit;
  transition: border-color 0.2s;
}

.note-modal textarea:focus {
  border-color: #fbbf24;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

.btn-cancel,
.btn-confirm {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  color: #4b5563;
}

.btn-cancel:hover {
  background: #e5e7eb;
}

.btn-confirm {
  background: #fbbf24;
  border: none;
  color: #78350f;
}

.btn-confirm:hover {
  background: #f59e0b;
}

/* 连接线样式 */
.connection-line {
  opacity: 0.6;
  transition: opacity 0.2s, stroke-width 0.2s;
}

.connection-line:hover {
  opacity: 1;
  stroke-width: 3;
}
</style>
