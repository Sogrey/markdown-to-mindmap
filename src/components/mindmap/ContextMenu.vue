<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="context-menu"
      :style="{ left: `${position.x}px`, top: `${position.y}px` }"
      @contextmenu.prevent
    >
      <template v-for="(item, index) in menuItems" :key="index">
        <div v-if="item.divider" class="menu-divider"></div>
        <button
          v-else
          class="menu-item"
          :class="{ disabled: item.disabled }"
          @click="handleClick(item.action)"
        >
          <span class="menu-icon">{{ item.icon }}</span>
          <span class="menu-label">{{ item.label }}</span>
        </button>
      </template>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch, onUnmounted } from 'vue'
import type { ContextMenuAction, ContextMenuItem } from '@/types/mindmap'

const props = defineProps<{
  visible: boolean
  position: { x: number; y: number }
  nodeText: string
  hasChildren: boolean
  isCollapsed: boolean
  hasNote: boolean
  isRoot: boolean
}>()

const emit = defineEmits<{
  action: [action: ContextMenuAction]
  close: []
}>()

const menuItems = computed<ContextMenuItem[]>(() => {
  const items: ContextMenuItem[] = [
    {
      action: 'edit',
      label: '编辑节点',
      icon: '✏️',
    },
    {
      action: 'addNote',
      label: props.hasNote ? '编辑备注' : '添加备注',
      icon: '📝',
    },
    {
      action: 'toggleNote',
      label: props.hasNote ? (props.nodeText ? '收起备注' : '显示备注') : '',
      icon: props.hasNote ? '👁️' : '',
      disabled: !props.hasNote,
    },
    {
      action: 'addChild',
      label: '添加子节点',
      icon: '➕',
    },
  ]

  // 只有非叶节点（hasChildren）才显示折叠/展开菜单项
  if (props.hasChildren) {
    items.push({
      action: 'toggleCollapse',
      label: props.isCollapsed ? '展开' : '折叠',
      icon: props.isCollapsed ? '📂' : '📁',
      disabled: !props.hasChildren,
    })
  }

  // 删除节点（根节点除外）
  if (!props.isRoot) {
    items.push({ action: 'divider', label: '', icon: '', divider: true })
    items.push({ action: 'delete', label: '删除节点', icon: '🗑️' })
  }

  return items
})

function handleClick(action: ContextMenuAction): void {
  emit('action', action)
  emit('close')
}

// 点击外部关闭
function handleClickOutside(e: MouseEvent): void {
  const target = e.target as HTMLElement
  if (!target.closest('.context-menu')) {
    emit('close')
  }
}

// ESC 关闭
function handleEscape(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    emit('close')
  }
}

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      document.addEventListener('click', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    } else {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }
)

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleEscape)
})
</script>

<style scoped>
.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  padding: 4px 0;
  min-width: 140px;
  z-index: 10000;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 13px;
  color: #1f2937;
  text-align: left;
  transition: background 0.15s;
}

.menu-item:hover:not(.disabled) {
  background: #f3f4f6;
}

.menu-item.disabled {
  color: #9ca3af;
  cursor: not-allowed;
}

.menu-icon {
  font-size: 14px;
  width: 20px;
  text-align: center;
}

.menu-label {
  flex: 1;
}

.menu-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 4px 8px;
}
</style>
