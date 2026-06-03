<script setup lang="ts">
import { computed } from 'vue'
import { ElMessageBox } from 'element-plus'
import type { Question } from '@/types'

const props = defineProps<{
  question: Question
  selected: boolean
}>()

const emit = defineEmits<{
  select: [id: string]
  update: [question: Question]
  delete: [id: string]
}>()

const typeConfig = {
  radio: { label: '单选题', icon: 'CircleCheck', color: '#409EFF' },
  checkbox: { label: '多选题', icon: 'CopyDocument', color: '#67C23A' },
  dropdown: { label: '下拉题', icon: 'ArrowDown', color: '#E6A23C' },
  rating: { label: '评分题', icon: 'Star', color: '#F56C6C' },
  scale: { label: '量表题', icon: 'Scale', color: '#909399' },
  text: { label: '文本题', icon: 'Edit', color: '#409EFF' },
  date: { label: '日期题', icon: 'Calendar', color: '#67C23A' },
  matrix: { label: '矩阵题', icon: 'Grid', color: '#E6A23C' }
}

const config = computed(() => typeConfig[props.question.type])

function handleSelect() {
  emit('select', props.question.id)
}

function handleDelete() {
  ElMessageBox.confirm('确定要删除这道题目吗？', '提示', {
    type: 'warning'
  }).then(() => {
    emit('delete', props.question.id)
  })
}

function getPreviewText(): string {
  const q = props.question
  switch (q.type) {
    case 'radio':
    case 'checkbox':
    case 'dropdown':
      return q.options?.map(o => o.text).join(' / ') || '请添加选项'
    case 'rating':
      return `${q.settings.minRating || 1} - ${q.settings.maxRating || 5} 星`
    case 'scale':
      return `${q.settings.minValue || 1} - ${q.settings.maxValue || 10}`
    case 'text':
      return q.settings.placeholder || '文本输入'
    case 'date':
      return '日期选择'
    case 'matrix':
      return `${q.settings.matrixRows?.length || 0} 行 × ${q.settings.matrixCols?.length || 0} 列`
    default:
      return ''
  }
}
</script>

<template>
  <div
    class="question-card"
    :class="{ selected, required: question.required }"
    @click="handleSelect"
  >
    <div class="card-header">
      <div class="drag-handle">
        <el-icon><Rank /></el-icon>
      </div>
      <div class="type-badge" :style="{ background: config.color }">
        <el-icon><component :is="config.icon" /></el-icon>
        <span>{{ config.label }}</span>
      </div>
      <el-tag v-if="question.required" type="danger" size="small">必填</el-tag>
      <div class="card-actions" @click.stop>
        <el-button size="small" text type="danger" @click="handleDelete">
          <el-icon><Delete /></el-icon>
        </el-button>
      </div>
    </div>

    <div class="card-body">
      <h4 class="question-title">{{ question.title }}</h4>
      <p class="question-preview">{{ getPreviewText() }}</p>
    </div>

    <div v-if="question.description" class="card-footer">
      <p class="question-desc">{{ question.description }}</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.question-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    border-color: var(--border-color);
    box-shadow: var(--shadow-light);
  }

  &.selected {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
  }

  &.required {
    border-left: 4px solid #F56C6C;
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;

  .drag-handle {
    cursor: grab;
    padding: 4px;
    color: var(--text-secondary);
    display: flex;
    align-items: center;

    &:active {
      cursor: grabbing;
    }
  }

  .type-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 16px;
    color: white;
    font-size: 12px;
    font-weight: 500;
  }

  .card-actions {
    margin-left: auto;
  }
}

.card-body {
  .question-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 8px 0;
  }

  .question-preview {
    font-size: 13px;
    color: var(--text-secondary);
    margin: 0;
    line-height: 1.6;
  }
}

.card-footer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--border-color);

  .question-desc {
    font-size: 13px;
    color: var(--text-secondary);
    margin: 0;
  }
}
</style>
