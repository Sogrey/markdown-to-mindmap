<template>
  <div class="app">
    <Toolbar 
      :mindmap-ref="markmapRef" 
      :markdown="markdownContent"
      @export="handleExport"
      @zoom-in="handleZoomIn"
      @zoom-out="handleZoomOut"
      @reset-view="handleResetView"
    />

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
          <span class="panel-hint">点击节点折叠/展开 | 滚轮缩放 | 拖拽移动</span>
        </div>
        <div class="mindmap-wrapper">
          <MarkmapView
            ref="markmapRef"
            :markdown="markdownContent"
            @node-click="handleNodeClick"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useMindmapStore } from './stores/mindmap'
import { exportToPNG, exportToSVG, exportToJSON, exportToMarkdown } from './utils/export'
import MarkdownEditor from './components/editor/MarkdownEditor.vue'
import MarkmapView from './components/mindmap/MarkmapView.vue'
import Toolbar from './components/toolbar/Toolbar.vue'
import type { ExportType } from '@/types/mindmap'

const store = useMindmapStore()

const markmapRef = ref<{
  fit: () => void
  zoomIn: () => void
  zoomOut: () => void
  reset: () => void
} | null>(null)

const markdownContent = ref<string>(store.markdownContent)
const isEditorCollapsed = ref<boolean>(false)

// 切换编辑器折叠状态
function toggleEditor(): void {
  isEditorCollapsed.value = !isEditorCollapsed.value
}

// 监听 Markdown 内容变化
watch(
  markdownContent,
  (newContent) => {
    store.updateMarkdown(newContent)
  },
  { immediate: true }
)

// 节点点击处理
function handleNodeClick(nodeData: any): void {
  console.log('点击节点:', nodeData.data?.content || nodeData.content)
}

// 导出处理
async function handleExport(type: ExportType): Promise<void> {
  // 获取 markmap 的 SVG 元素
  const svgElement = document.querySelector('.markmap-svg') as SVGSVGElement | null
  
  switch (type) {
    case 'png':
      await exportToPNG(svgElement)
      break
    case 'svg':
      await exportToSVG(svgElement)
      break
    case 'json':
      exportToJSON(markdownContent.value)
      break
    case 'markdown':
      exportToMarkdown(markdownContent.value)
      break
  }
}

// 缩放控制
function handleZoomIn(): void {
  markmapRef.value?.zoomIn()
}

function handleZoomOut(): void {
  markmapRef.value?.zoomOut()
}

function handleResetView(): void {
  markmapRef.value?.reset()
}

// 初始化
onMounted(() => {
  // 从 store 加载保存的内容
  markdownContent.value = store.markdownContent
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

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
  overflow: hidden;
}

/* 编辑器面板 */
.editor-panel {
  width: 400px;
  min-width: 300px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border-color);
  background: var(--panel-bg);
  transition: width 0.3s ease;
}

.editor-panel.collapsed {
  width: 0;
  min-width: 0;
  border-right: none;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--header-bg);
  border-bottom: 1px solid var(--border-color);
}

.panel-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.panel-hint {
  font-size: 12px;
  color: var(--text-secondary);
}

.collapse-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.2s;
}

.collapse-btn:hover {
  background: var(--hover-bg);
}

.editor-wrapper {
  flex: 1;
  overflow: hidden;
}

/* 折叠指示器 */
.collapse-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 60px;
  background: var(--panel-bg);
  border: 1px solid var(--border-color);
  border-left: none;
  border-radius: 0 8px 8px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 100;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
}

.collapse-indicator:hover {
  background: var(--hover-bg);
}

.collapse-text {
  font-size: 18px;
}

/* 思维导图面板 */
.mindmap-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-color);
}

.mindmap-wrapper {
  flex: 1;
  overflow: hidden;
  position: relative;
}

/* CSS 变量 */
:root {
  --bg-color: #f8fafc;
  --panel-bg: #ffffff;
  --header-bg: #f1f5f9;
  --border-color: #e2e8f0;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --hover-bg: #e2e8f0;
}

:root[data-theme='dark'] {
  --bg-color: #0f172a;
  --panel-bg: #1e293b;
  --header-bg: #334155;
  --border-color: #475569;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --hover-bg: #334155;
}
</style>
