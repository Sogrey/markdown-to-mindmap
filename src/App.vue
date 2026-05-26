<template>
  <div class="app">
    <Toolbar :mindmap-ref="mindmapRef" :tree-data="treeData" @export="handleExport" />

    <div class="main-content">
      <!-- 左侧编辑器 -->
      <div class="editor-panel" :class="{ collapsed: isEditorCollapsed }">
        <div class="panel-header">
          <span class="panel-title">📝 Markdown 编辑器</span>
          <div class="panel-actions">
            <span class="panel-hint">使用 # 标题创建层级结构</span>
            <button
              class="collapse-btn"
              @click="toggleEditor"
              :title="isEditorCollapsed ? '展开编辑器' : '收起编辑器'"
            >
              {{ isEditorCollapsed ? '➡️' : '⬅️' }}
            </button>
          </div>
        </div>
        <div class="editor-wrapper" v-show="!isEditorCollapsed">
          <MarkdownEditor v-model="markdownContent" />
        </div>
      </div>

      <!-- 折叠指示器 -->
      <div
        v-if="isEditorCollapsed"
        class="collapse-indicator"
        @click="toggleEditor"
        title="点击展开编辑器"
      >
        <span class="collapse-text">📝</span>
      </div>

      <!-- 右侧思维导图 -->
      <div class="mindmap-panel">
        <div class="panel-header">
          <span class="panel-title">🧠 思维导图</span>
          <span class="panel-hint">右键菜单 | 双击编辑 | 滚轮缩放</span>
        </div>
        <div class="mindmap-wrapper">
          <MindMap
            ref="mindmapRef"
            :tree-data="treeData"
            @node-click="handleNodeClick"
            @add-child="handleAddChild"
            @edit-node="handleEditNode"
            @delete-node="handleDeleteNode"
            @add-note="handleAddNote"
          />
        </div>
      </div>
    </div>

    <!-- 添加节点弹窗 -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="closeAddModal">
      <div class="modal-content">
        <h3>添加子节点</h3>
        <input
          ref="newNodeInput"
          v-model="newNodeText"
          type="text"
          placeholder="输入节点内容..."
          @keyup.enter="confirmAddNode"
          @keyup.esc="closeAddModal"
        />
        <div class="modal-actions">
          <button class="btn-cancel" @click="closeAddModal">取消</button>
          <button class="btn-confirm" @click="confirmAddNode">添加</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useMindmapStore } from './stores/mindmap'
import { parseMarkdownToTree } from './utils/parser'
import { exportToPNG, exportToSVG, exportToJSON, exportToMarkdown } from './utils/export'
import MarkdownEditor from './components/editor/MarkdownEditor.vue'
import MindMap from './components/mindmap/MindMap.vue'
import Toolbar from './components/toolbar/Toolbar.vue'
import type { MindmapNode, LayoutNode, ExportType } from '@/types/mindmap'

const store = useMindmapStore()

const mindmapRef = ref<{
  svgRef: SVGSVGElement | null;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  getLayoutSize: () => { width: number; height: number };
} | null>(null)
const markdownContent = ref<string>(store.markdownContent)
const isEditorCollapsed = ref<boolean>(false)

// 添加节点相关
const showAddModal = ref<boolean>(false)
const newNodeText = ref<string>('')
const newNodeInput = ref<HTMLInputElement | null>(null)
const addTargetNode = ref<LayoutNode | null>(null)

// 切换编辑器折叠状态
function toggleEditor(): void {
  isEditorCollapsed.value = !isEditorCollapsed.value
}

// 监听 Markdown 内容变化，解析为思维导图
watch(
  markdownContent,
  (newContent) => {
    store.updateMarkdown(newContent)
    const tree = parseMarkdownToTree(newContent)
    store.updateMindmapData(tree)
  },
  { immediate: true }
)

// 计算属性：当前思维导图数据
const treeData = computed<MindmapNode | null>(() => store.mindmapData)

// 节点点击处理
function handleNodeClick(node: LayoutNode): void {
  console.log('点击节点:', node.text)
}

// 添加子节点
function handleAddChild(node: LayoutNode): void {
  addTargetNode.value = node
  newNodeText.value = ''
  showAddModal.value = true
  nextTick(() => {
    newNodeInput.value?.focus()
  })
}

// 编辑节点（支持标准格式：标题行 + 多行备注）
function handleEditNode(nodeId: string, newText: string): void {
  const lines = markdownContent.value.split('\n')
  const targetNode = findNodeById(treeData.value, nodeId)

  if (!targetNode) return

  const targetLevel = targetNode.level
  const targetText = targetNode.text
  const prefix = '#'.repeat(targetLevel) + ' '

  // 查找对应节点
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('#')) {
      const level = (line.match(/^#+/) || [''])[0].length
      if (level === targetLevel) {
        const lineText = line.replace(/^#+\s*/, '').trim()
        // 移除可能的行内备注，获取纯标题文本
        const cleanText = lineText.replace(/\s*>\s*.+$/, '').trim()

        if (cleanText === targetText) {
          // 收集当前备注内容（支持两种格式）
          let noteLines: string[] = []
          
          // 检查是否是行内格式
          const inlineNoteMatch = lineText.match(/^(.+?)\s*>\s*(.+)$/)
          if (inlineNoteMatch) {
            // 行内格式，直接使用备注内容
            noteLines = [inlineNoteMatch[2].trim()]
          } else {
            // 检查下一行是否开始备注（标准格式）
            let j = i + 1
            while (j < lines.length && /^\s*>/.test(lines[j])) {
              noteLines.push(lines[j].replace(/^\s*>\s?/, '').trim())
              j++
            }
          }

          // 更新标题行（不含备注）
          lines[i] = prefix + newText

          // 删除旧的备注行
          let deleteCount = 0
          let j = i + 1
          while (j < lines.length && /^\s*>/.test(lines[j])) {
            deleteCount++
            j++
          }
          if (deleteCount > 0) {
            lines.splice(i + 1, deleteCount)
          }

          // 插入新的备注行（标准格式，每行都有 > 前缀）
          if (noteLines.length > 0) {
            // 添加空行
            lines.splice(i + 1, 0, '')
            
            // 添加备注行
            noteLines.forEach((noteLine, index) => {
              lines.splice(i + 2 + index, 0, '> ' + noteLine)
            })
          }

          markdownContent.value = lines.join('\n')
          return
        }
      }
    }
  }
}

// 删除节点（包含所有子节点和备注）
function handleDeleteNode(nodeId: string): void {
  const targetNode = findNodeById(treeData.value, nodeId)
  if (!targetNode) return

  // 计算子节点数量用于确认提示
  const childCount = countAllChildren(targetNode)
  const confirmMsg = childCount > 0
    ? `确定要删除节点 "${targetNode.text}" 吗？\n此操作将同时删除其 ${childCount} 个子节点，不可恢复！`
    : `确定要删除节点 "${targetNode.text}" 吗？`

  if (!confirm(confirmMsg)) return

  const lines = markdownContent.value.split('\n')
  const targetLevel = targetNode.level
  const targetText = targetNode.text

  // 查找起始行
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('#')) {
      const level = (line.match(/^#+/) || [''])[0].length
      if (level === targetLevel) {
        const lineText = line.replace(/^#+\s*/, '').trim()
        // 移除可能的行内备注，获取纯标题文本
        const cleanText = lineText.replace(/\s*>\s*.+$/, '').trim()

        if (cleanText === targetText) {
          // 找到起始行，现在找结束行（下一个同级或更高级标题）
          let endIndex = lines.length

          // 查找下一个同级或更高级标题
          for (let j = i + 1; j < lines.length; j++) {
            const nextLine = lines[j]
            if (nextLine.startsWith('#')) {
              const nextLevel = (nextLine.match(/^#+/) || [''])[0].length
              if (nextLevel <= targetLevel) {
                endIndex = j
                break
              }
            }
          }

          // 删除从标题行到结束行（不包含）
          lines.splice(i, endIndex - i)
          markdownContent.value = lines.join('\n')
          return
        }
      }
    }
  }
}

// 递归计算所有子节点数量
function countAllChildren(node: MindmapNode): number {
  if (!node.children || node.children.length === 0) return 0

  let count = node.children.length
  for (const child of node.children) {
    count += countAllChildren(child)
  }
  return count
}

// 递归查找节点
function findNodeById(node: MindmapNode | null, id: string): MindmapNode | null {
  if (!node) return null
  if (node.id === id) return node

  if (node.children) {
    for (const child of node.children) {
      const found = findNodeById(child, id)
      if (found) return found
    }
  }
  return null
}

// 添加备注（使用标准格式：标题行 + 备注行，支持多行）
function handleAddNote(nodeId: string, note: string): void {
  const lines = markdownContent.value.split('\n')
  const targetNode = findNodeById(treeData.value, nodeId)

  if (!targetNode) return

  const targetLevel = targetNode.level
  const targetText = targetNode.text

  // 查找对应节点行
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('#')) {
      const level = (line.match(/^#+/) || [''])[0].length
      if (level === targetLevel) {
        const lineText = line.replace(/^#+\s*/, '').trim()
        // 移除可能的行内备注，获取纯标题文本
        const cleanText = lineText.replace(/\s*>\s*.+$/, '').trim()

        if (cleanText === targetText) {
          // 构建新的标题行（不含备注）
          const prefix = '#'.repeat(targetLevel) + ' '
          lines[i] = prefix + cleanText

          // 删除旧的备注行（可能有多行）
          let j = i + 1
          while (j < lines.length && /^\s*>/.test(lines[j])) {
            lines.splice(j, 1)
          }

          // 插入新的备注行（每行都添加 >）
          const noteLines = note.split('\n')
          noteLines.forEach((line, index) => {
            lines.splice(i + 1 + index, 0, '> ' + line)
          })

          markdownContent.value = lines.join('\n')
          return
        }
      }
    }
  }
}

// 关闭添加弹窗
function closeAddModal(): void {
  showAddModal.value = false
  newNodeText.value = ''
  addTargetNode.value = null
}

// 查找节点的层级
function findNodeLevel(node: MindmapNode, targetId: string, level = 1): number {
  if (node.id === targetId) return level
  if (node.children) {
    for (const child of node.children) {
      const found = findNodeLevel(child, targetId, level + 1)
      if (found) return found
    }
  }
  return 0
}

// 确认添加节点
function confirmAddNode(): void {
  if (!newNodeText.value.trim() || !addTargetNode.value) {
    closeAddModal()
    return
  }

  // 查找目标节点的层级
  const targetLevel = findNodeLevel(treeData.value!, addTargetNode.value.id)

  if (targetLevel > 0) {
    // 子节点层级 = 父节点层级 + 1
    const childLevel = targetLevel + 1
    // 在 Markdown 中查找该节点的位置并插入
    const lines = markdownContent.value.split('\n')
    const parentPrefix = '#'.repeat(targetLevel) + ' '
    const childPrefix = '#'.repeat(childLevel) + ' '

    // 查找包含该节点文本的标题行
    let insertIndex = -1
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === parentPrefix + addTargetNode.value!.text) {
        // 在该标题后插入新标题
        insertIndex = i + 1
        break
      }
    }

    if (insertIndex > 0) {
      // 找到下一个同级或更高级标题之前的位置（即父节点的内容结束位置）
      let endIndex = insertIndex
      for (let i = insertIndex; i < lines.length; i++) {
        const line = lines[i].trim()
        if (line && !line.startsWith('#')) continue
        if (line.startsWith('#')) {
          const currentLevel = (line.match(/^#+/) || [''])[0].length
          if (currentLevel <= targetLevel) {
            break
          }
        }
        endIndex = i + 1
      }

      // 插入新子节点（使用子层级）
      lines.splice(endIndex, 0, childPrefix + newNodeText.value.trim())

      markdownContent.value = lines.join('\n')
    }
  }

  closeAddModal()
}

// 导出处理
async function handleExport(type: ExportType): Promise<void> {
  if (type === 'markdown') {
    if (treeData.value) {
      exportToMarkdown(treeData.value, 'mindmap')
    } else {
      alert('请先生成思维导图')
    }
    return
  }

  if (!mindmapRef.value?.svgRef) {
    alert('请先生成思维导图')
    return
  }

  const svg = mindmapRef.value.svgRef

  switch (type) {
    case 'png':
      await exportToPNG(svg, 'mindmap')
      break
    case 'svg':
      exportToSVG(svg, 'mindmap')
      break
    case 'json':
      if (treeData.value) {
        exportToJSON(treeData.value, 'mindmap')
      }
      break
  }
}

// 初始化主题
onMounted(() => {
  store.applyTheme(store.currentTheme)
})
</script>

<style scoped>
.app {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.main-content {
  flex: 1;
  display: flex;
  gap: 0;
  background: #e5e7eb;
  overflow: hidden;
}

.editor-panel {
  width: 33.33%;
  min-width: 200px;
  max-width: 50%;
  display: flex;
  flex-direction: column;
  background: #fff;
  transition: width 0.3s ease, min-width 0.3s ease, max-width 0.3s ease;
  position: relative;
}

.editor-panel.collapsed {
  width: 0;
  min-width: 0;
  max-width: 0;
  overflow: hidden;
}

.mindmap-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
  min-width: 0;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-hint {
  font-size: 12px;
  color: #9ca3af;
}

.collapse-btn {
  padding: 4px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.collapse-btn:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.editor-wrapper {
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.mindmap-wrapper {
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.collapse-indicator {
  width: 32px;
  background: #f9fafb;
  border-left: 1px solid #e5e7eb;
  border-right: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}

.collapse-indicator:hover {
  background: #f3f4f6;
}

.collapse-text {
  font-size: 16px;
  writing-mode: vertical-rl;
  text-orientation: mixed;
}

/* 弹窗样式 */
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

.modal-content h3 {
  margin: 0 0 16px;
  font-size: 18px;
  color: #1f2937;
}

.modal-content input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.modal-content input:focus {
  border-color: #3b82f6;
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
  background: #3b82f6;
  border: none;
  color: white;
}

.btn-confirm:hover {
  background: #2563eb;
}
</style>
