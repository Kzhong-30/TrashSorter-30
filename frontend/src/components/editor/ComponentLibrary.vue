<script setup lang="ts">
import type { QuestionType } from '@/types'

const emit = defineEmits<{
  add: [type: QuestionType]
}>()

const components = [
  { type: 'radio', label: '单选', icon: 'CircleCheck', color: '#409EFF' },
  { type: 'checkbox', label: '多选', icon: 'CopyDocument', color: '#67C23A' },
  { type: 'dropdown', label: '下拉', icon: 'ArrowDown', color: '#E6A23C' },
  { type: 'rating', label: '评分', icon: 'Star', color: '#F56C6C' },
  { type: 'scale', label: '量表', icon: 'Scale', color: '#909399' },
  { type: 'text', label: '文本', icon: 'Edit', color: '#409EFF' },
  { type: 'date', label: '日期', icon: 'Calendar', color: '#67C23A' },
  { type: 'matrix', label: '矩阵', icon: 'Grid', color: '#E6A23C' }
] as const
</script>

<template>
  <div class="component-library">
    <div
      v-for="comp in components"
      :key="comp.type"
      class="component-item"
      @click="emit('add', comp.type as QuestionType)"
    >
      <div class="component-icon" :style="{ background: comp.color }">
        <el-icon><component :is="comp.icon" /></el-icon>
      </div>
      <span class="component-label">{{ comp.label }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.component-library {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.component-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px;
  background: var(--bg-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #e6efff;
    transform: translateY(-2px);

    .component-icon {
      transform: scale(1.1);
    }
  }

  .component-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 12px;
    color: white;
    font-size: 24px;
    transition: transform 0.3s ease;
  }

  .component-label {
    font-size: 13px;
    color: var(--text-regular);
    font-weight: 500;
  }
}
</style>
