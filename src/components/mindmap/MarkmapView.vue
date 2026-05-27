<template>
  <div class="markmap-container">
    <svg ref="svgRef" class="markmap-svg"></svg>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { Markmap } from 'markmap-view'
import { Transformer } from 'markmap-lib'
import type { IMarkmapOptions } from 'markmap-view'

const props = defineProps<{
  markdown: string
}>()

const emit = defineEmits<{
  nodeClick: [nodeData: any]
}>()

const svgRef = ref<SVGSVGElement | null>(null)
let markmapInstance: Markmap | null = null
const transformer = new Transformer()

// 初始化 markmap
function initMarkmap() {
  if (!svgRef.value) return

  const options: Partial<IMarkmapOptions> = {
    autoFit: true,
    fitRatio: 0.8,
    duration: 500,
    maxWidth: 300,
    nodeMinHeight: 24,
    spacingVertical: 12,
    spacingHorizontal: 80,
    paddingX: 12,
    initialExpandLevel: -1,
    zoom: true,
    pan: true,
    color: (node: any) => {
      // 根据层级返回不同颜色
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
      const depth = node.state?.depth || 0
      return colors[depth % colors.length]
    },
  }

  markmapInstance = Markmap.create(svgRef.value, options)

  // 监听节点点击事件
  if (markmapInstance) {
    const svg = svgRef.value
    svg.addEventListener('click', handleNodeClick)
  }
}

// 处理节点点击
function handleNodeClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  const nodeElement = target.closest('.markmap-node')
  if (nodeElement) {
    const nodeData = (nodeElement as any).__data__
    if (nodeData) {
      emit('nodeClick', nodeData)
    }
  }
}

// 更新 markmap 数据
function updateMarkmap() {
  if (!markmapInstance) return

  const { root } = transformer.transform(props.markdown)
  markmapInstance.setData(root)
  markmapInstance.fit()
}

// 监听 markdown 变化
watch(() => props.markdown, () => {
  updateMarkmap()
}, { immediate: true })

onMounted(() => {
  initMarkmap()
  updateMarkmap()
})

onUnmounted(() => {
  if (svgRef.value) {
    svgRef.value.removeEventListener('click', handleNodeClick)
  }
  if (markmapInstance) {
    markmapInstance.destroy()
  }
})

// 暴露方法给父组件
defineExpose({
  fit: () => markmapInstance?.fit(),
  zoomIn: () => markmapInstance?.rescale(1.2),
  zoomOut: () => markmapInstance?.rescale(0.8),
  reset: () => {
    markmapInstance?.rescale(1)
    markmapInstance?.fit()
  },
})
</script>

<style scoped>
.markmap-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.markmap-svg {
  width: 100%;
  height: 100%;
}

:deep(.markmap-node) {
  cursor: pointer;
}

:deep(.markmap-node:hover) {
  filter: brightness(1.1);
}

:deep(.markmap-node-circle) {
  cursor: pointer;
}

:deep(.markmap-link) {
  fill: none;
  stroke-opacity: 0.4;
}
</style>
