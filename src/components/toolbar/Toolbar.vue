<template>
  <div class="toolbar">
    <div class="toolbar-left">
      <div class="toolbar-title">
        <span class="logo">🧠</span>
        <span class="title-text">Markdown 转思维导图</span>
      </div>
    </div>

    <div class="toolbar-center">
      <ThemeSelector />
    </div>

    <div class="toolbar-right">
      <!-- 重置视图 -->
      <button class="tool-btn" @click="resetView" title="重置视图">🏠</button>

      <!-- 缩放 -->
      <div class="zoom-controls">
        <button class="tool-btn" @click="zoomOut" title="缩小">➖</button>
        <span class="zoom-level">{{ Math.round(zoom * 100) }}%</span>
        <button class="tool-btn" @click="zoomIn" title="放大">➕</button>
      </div>

      <div class="divider"></div>

      <!-- 导出 -->
      <div class="export-group">
        <button class="tool-btn export-btn" @click="showExportMenu = !showExportMenu">
          📥 导出
        </button>
        <div v-if="showExportMenu" class="export-menu">
          <button class="export-item" @click="handleExport('png')">📷 PNG 图片</button>
          <button class="export-item" @click="handleExport('svg')">📐 SVG 矢量图</button>
          <button class="export-item" @click="handleExport('json')">📄 JSON 数据</button>
          <button class="export-item" @click="handleExport('markdown')">📝 Markdown</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useMindmapStore } from '../../stores/mindmap'
import type { MindmapNode, ExportType } from '@/types/mindmap'
import ThemeSelector from '../theme/ThemeSelector.vue'

const emit = defineEmits<{
  export: [type: ExportType]
}>()

const props = defineProps<{
  mindmapRef: { svgRef: SVGSVGElement | null; zoomIn: () => void; zoomOut: () => void; resetView: () => void; getLayoutSize: () => { width: number; height: number } } | null
  treeData: MindmapNode | null
}>()

const store = useMindmapStore()

const showExportMenu = ref<boolean>(false)

const zoom = computed(() => store.zoomLevel)

function resetView(): void {
  props.mindmapRef?.resetView()
}

function zoomIn(): void {
  props.mindmapRef?.zoomIn()
}

function zoomOut(): void {
  props.mindmapRef?.zoomOut()
}

function handleExport(type: ExportType): void {
  showExportMenu.value = false
  emit('export', type)
}

// 点击外部关闭菜单
function handleDocumentClick(e: MouseEvent): void {
  if (!(e.target as HTMLElement).closest('.export-group')) {
    showExportMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  gap: 16px;
}

.toolbar-left {
  flex: 1;
}

.toolbar-center {
  flex: 2;
  display: flex;
  justify-content: center;
}

.toolbar-right {
  flex: 2;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.toolbar-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo {
  font-size: 24px;
}

.title-text {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.tool-btn {
  padding: 6px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.tool-btn:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.zoom-level {
  min-width: 48px;
  text-align: center;
  font-size: 12px;
  color: #666;
}

.divider {
  width: 1px;
  height: 24px;
  background: #e5e7eb;
  margin: 0 4px;
}

.export-group {
  position: relative;
}

.export-btn {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.export-btn:hover {
  background: #2563eb;
  border-color: #2563eb;
}

.export-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 100;
  min-width: 140px;
}

.export-item {
  display: block;
  width: 100%;
  padding: 10px 16px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s;
}

.export-item:hover {
  background: #f3f4f6;
}

.export-item + .export-item {
  border-top: 1px solid #f3f4f6;
}
</style>
