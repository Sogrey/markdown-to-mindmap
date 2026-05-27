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
import type { ExportType } from '@/types/mindmap'
import ThemeSelector from '../theme/ThemeSelector.vue'

const emit = defineEmits<{
  export: [type: ExportType]
  zoomIn: []
  zoomOut: []
  resetView: []
}>()

const props = defineProps<{
  mindmapRef: { fit: () => void; zoomIn: () => void; zoomOut: () => void; reset: () => void } | null
  markdown: string
}>()

const store = useMindmapStore()

const showExportMenu = ref<boolean>(false)

const zoom = computed(() => store.zoomLevel)

function resetView(): void {
  emit('resetView')
}

function zoomIn(): void {
  emit('zoomIn')
}

function zoomOut(): void {
  emit('zoomOut')
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
  white-space: nowrap;
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
  font-size: 13px;
  color: #6b7280;
  min-width: 48px;
  text-align: center;
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
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  padding: 4px 0;
  min-width: 140px;
  z-index: 1000;
}

.export-item {
  display: block;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 13px;
  text-align: left;
  transition: background 0.15s;
}

.export-item:hover {
  background: #f3f4f6;
}
</style>
