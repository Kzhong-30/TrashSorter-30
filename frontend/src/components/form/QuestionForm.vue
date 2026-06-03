<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Question, AnswerValue } from '@/types'

const props = defineProps<{
  question: Question
  index: number
  readonly?: boolean
  modelValue?: AnswerValue
}>()

const emit = defineEmits<{
  'update:modelValue': [value: AnswerValue]
}>()

const answer = ref<AnswerValue>(props.modelValue || (props.question.type === 'checkbox' ? [] : null))

watch(() => props.modelValue, (val) => {
  answer.value = val || (props.question.type === 'checkbox' ? [] : null)
})

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

function handleRadioChange(val: string) {
  answer.value = val
  emit('update:modelValue', answer.value)
}

function handleCheckboxChange(val: string[], checked: boolean) {
  if (checked) {
    answer.value = [...(answer.value as string[] || []), val[0]]
  } else {
    answer.value = (answer.value as string[] || []).filter(v => v !== val[0])
  }
  emit('update:modelValue', answer.value)
}

function handleDropdownChange(val: string) {
  answer.value = val
  emit('update:modelValue', answer.value)
}

function handleTextInput(e: Event) {
  const target = e.target as HTMLInputElement
  answer.value = target.value
  emit('update:modelValue', answer.value)
}

function handleRatingClick(val: number) {
  answer.value = val
  emit('update:modelValue', answer.value)
}

function handleScaleChange(val: number) {
  answer.value = val
  emit('update:modelValue', answer.value)
}

function handleDateChange(val: string) {
  answer.value = val
  emit('update:modelValue', answer.value)
}

function handleMatrixChange(rowIndex: number, colIndex: number) {
  const matrixAnswer = answer.value as Record<number, number> || {}
  matrixAnswer[rowIndex] = colIndex
  answer.value = { ...matrixAnswer }
  emit('update:modelValue', answer.value)
}

function isOptionSelected(optionId: string): boolean {
  if (props.question.type === 'checkbox') {
    return (answer.value as string[] || []).includes(optionId)
  }
  return answer.value === optionId
}
</script>

<template>
  <div class="question-form" :class="{ required: question.required }">
    <div class="question-header">
      <span class="question-number">{{ index + 1 }}.</span>
      <span class="question-title">{{ question.title }}</span>
      <span v-if="question.required" class="required-mark">*</span>
    </div>

    <p v-if="question.description" class="question-desc">{{ question.description }}</p>

    <div class="question-content">
      <template v-if="question.type === 'radio'">
        <el-radio-group
          :model-value="answer"
          @change="handleRadioChange"
        >
          <el-radio
            v-for="option in question.options"
            :key="option.id"
            :value="option.id"
            :disabled="readonly"
          >
            {{ option.text }}
          </el-radio>
        </el-radio-group>
      </template>

      <template v-else-if="question.type === 'checkbox'">
        <el-checkbox-group :model-value="answer as string[]">
          <el-checkbox
            v-for="option in question.options"
            :key="option.id"
            :value="option.id"
            :disabled="readonly"
            @change="(checked: boolean) => handleCheckboxChange([option.id], checked)"
          >
            {{ option.text }}
          </el-checkbox>
        </el-checkbox-group>
      </template>

      <template v-else-if="question.type === 'dropdown'">
        <el-select
          :model-value="answer as string"
          placeholder="请选择"
          style="width: 100%"
          @change="handleDropdownChange"
        >
          <el-option
            v-for="option in question.options"
            :key="option.id"
            :label="option.text"
            :value="option.id"
            :disabled="readonly"
          />
        </el-select>
      </template>

      <template v-else-if="question.type === 'rating'">
        <div class="rating-stars">
          <el-rate
            :model-value="answer as number"
            :max="question.settings.maxRating || 5"
            :colors="['#99A9BF', '#F7BA2A', '#FF9900']"
            @change="handleRatingClick"
          />
          <span v-if="question.settings.ratingLabels" class="rating-label">
            {{ question.settings.ratingLabels[(answer as number) - 1] || '' }}
          </span>
        </div>
      </template>

      <template v-else-if="question.type === 'scale'">
        <div class="scale-slider">
          <span class="scale-value">{{ question.settings.minValue || 1 }}</span>
          <el-slider
            :model-value="answer as number"
            :min="question.settings.minValue || 1"
            :max="question.settings.maxValue || 10"
            :step="question.settings.step || 1"
            style="width: 80%; margin: 0 16px"
            @change="handleScaleChange"
          />
          <span class="scale-value">{{ question.settings.maxValue || 10 }}</span>
        </div>
        <div class="current-value">
          当前值: <strong>{{ answer || (question.settings.minValue || 1) }}</strong>
        </div>
      </template>

      <template v-else-if="question.type === 'text'">
        <el-input
          :model-value="answer as string"
          :type="question.settings.rows && question.settings.rows > 1 ? 'textarea' : 'text'"
          :rows="question.settings.rows || 4"
          :placeholder="question.settings.placeholder || '请输入...'"
          :maxlength="question.settings.maxLength"
          show-word-limit
          @input="handleTextInput"
        />
      </template>

      <template v-else-if="question.type === 'date'">
        <el-date-picker
          :model-value="answer as string"
          type="date"
          placeholder="选择日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 100%"
          @change="handleDateChange"
        />
      </template>

      <template v-else-if="question.type === 'matrix'">
        <div class="matrix-table">
          <table>
            <thead>
              <tr>
                <th></th>
                <th v-for="col in question.settings.matrixCols" :key="col">{{ col }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, rowIndex) in question.settings.matrixRows" :key="row">
                <td class="row-label">{{ row }}</td>
                <td v-for="(col, colIndex) in question.settings.matrixCols" :key="col">
                  <el-radio
                    :model-value="(answer as Record<number, number>)?.[rowIndex]"
                    :value="colIndex"
                    :disabled="readonly"
                    @change="handleMatrixChange(rowIndex, colIndex)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.question-form {
  padding: 24px;
  border-bottom: 1px solid var(--border-color);
  transition: background 0.3s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: rgba(64, 158, 255, 0.02);
  }

  &.required .question-title::after {
    content: ' *';
    color: #F56C6C;
  }
}

.question-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;

  .question-number {
    font-size: 16px;
    font-weight: 600;
    color: var(--primary-color);
    margin-right: 8px;
  }

  .question-title {
    font-size: 16px;
    font-weight: 500;
    color: var(--text-primary);
    line-height: 1.6;
  }
}

.question-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 16px 24px;
  line-height: 1.5;
}

.question-content {
  margin-left: 24px;

  .el-radio, .el-checkbox {
    display: flex;
    align-items: center;
    margin: 10px 0;
    line-height: 1.6;

    :deep(.el-radio__label), :deep(.el-checkbox__label) {
      font-size: 15px;
      color: var(--text-regular);
    }
  }
}

.rating-stars {
  display: flex;
  align-items: center;
  gap: 16px;

  .rating-label {
    font-size: 14px;
    color: var(--text-secondary);
  }
}

.scale-slider {
  display: flex;
  align-items: center;

  .scale-value {
    font-size: 14px;
    color: var(--text-secondary);
    min-width: 20px;
  }
}

.current-value {
  text-align: center;
  margin-top: 12px;
  font-size: 14px;
  color: var(--text-secondary);

  strong {
    color: var(--primary-color);
    font-size: 18px;
  }
}

.matrix-table {
  overflow-x: auto;

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;

    th, td {
      padding: 12px;
      text-align: center;
      border: 1px solid var(--border-color);
    }

    th {
      background: var(--bg-color);
      font-weight: 500;
    }

    .row-label {
      text-align: left;
      background: var(--bg-color);
      font-weight: 500;
    }
  }
}
</style>
