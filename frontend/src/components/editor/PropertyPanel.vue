<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ElButton, ElInput, ElSwitch, ElInputNumber, ElSlider, El-tag } from 'element-plus'
import { generateId } from '@/utils/helpers'
import type { Question, Option, QuestionSettings } from '@/types'

const props = defineProps<{
  question: Question
  questions: Question[]
}>()

const emit = defineEmits<{
  update: [question: Question]
}>()

const localQuestion = ref<Question>({ ...props.question })

watch(() => props.question, (newVal) => {
  localQuestion.value = JSON.parse(JSON.stringify(newVal))
}, { deep: true })

function updateField<K extends keyof Question>(field: K, value: Question[K]) {
  localQuestion.value[field] = value
  emit('update', { ...localQuestion.value })
}

function updateSetting<K extends keyof QuestionSettings>(field: K, value: QuestionSettings[K]) {
  localQuestion.value.settings = { ...localQuestion.value.settings, [field]: value }
  emit('update', { ...localQuestion.value })
}

function handleTitleChange(val: string) {
  updateField('title', val)
}

function handleDescChange(val: string) {
  updateField('description', val)
}

function handleRequiredChange(val: boolean) {
  updateField('required', val)
}

function addOption() {
  const options = localQuestion.value.options || []
  options.push({
    id: generateId(),
    text: `选项 ${options.length + 1}`
  })
  updateField('options', [...options])
}

function updateOption(index: number, text: string) {
  if (!localQuestion.value.options) return
  localQuestion.value.options[index].text = text
  updateField('options', [...localQuestion.value.options])
}

function deleteOption(index: number) {
  if (!localQuestion.value.options) return
  localQuestion.value.options.splice(index, 1)
  updateField('options', [...localQuestion.value.options])
}

const targetQuestions = computed(() => {
  const idx = props.questions.findIndex(q => q.id === localQuestion.value.id)
  return props.questions.slice(idx + 1)
})

function setOptionJump(index: number, jumpTo: number | null) {
  if (!localQuestion.value.options) return
  localQuestion.value.options[index].jumpTo = jumpTo || undefined
  updateField('options', [...localQuestion.value.options])
}

const hasOptions = computed(() => {
  return ['radio', 'checkbox', 'dropdown'].includes(localQuestion.value.type)
})

const isRating = computed(() => localQuestion.value.type === 'rating')
const isScale = computed(() => localQuestion.value.type === 'scale')
const isText = computed(() => localQuestion.value.type === 'text')
const isMatrix = computed(() => localQuestion.value.type === 'matrix')

const ratingMarks = computed(() => {
  const min = localQuestion.value.settings.minRating || 1
  const max = localQuestion.value.settings.maxRating || 5
  const marks: Record<number, string> = {}
  for (let i = min; i <= max; i++) {
    marks[i] = `${i}`
  }
  return marks
})

function updateMatrixRows(val: string[]) {
  updateSetting('matrixRows', val)
}

function updateMatrixCols(val: string[]) {
  updateSetting('matrixCols', val)
}

function addMatrixRow() {
  const rows = [...(localQuestion.value.settings.matrixRows || [])]
  rows.push(`行 ${rows.length + 1}`)
  updateMatrixRows(rows)
}

function addMatrixCol() {
  const cols = [...(localQuestion.value.settings.matrixCols || [])]
  cols.push(`列 ${cols.length + 1}`)
  updateMatrixCols(cols)
}
</script>

<template>
  <div class="property-panel">
    <el-tabs>
      <el-tab-pane label="基础设置">
        <div class="form-group">
          <label>题目内容</label>
          <el-input
            v-model="localQuestion.title"
            type="textarea"
            :rows="2"
            placeholder="请输入题目"
            @blur="handleTitleChange(localQuestion.title)"
          />
        </div>

        <div class="form-group">
          <label>题目描述</label>
          <el-input
            v-model="localQuestion.description"
            type="textarea"
            :rows="2"
            placeholder="选填，题目补充说明"
            @blur="handleDescChange(localQuestion.description)"
          />
        </div>

        <div class="form-group">
          <label>必填设置</label>
          <div class="switch-row">
            <span>设为必填</span>
            <el-switch
              :model-value="localQuestion.required"
              @change="handleRequiredChange"
            />
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane v-if="hasOptions" label="选项设置">
        <div class="options-list">
          <div
            v-for="(option, index) in localQuestion.options"
            :key="option.id"
            class="option-item"
          >
            <el-input
              v-model="option.text"
              placeholder="选项内容"
              @blur="updateOption(index, option.text)"
            />
            <el-select
              v-model="option.jumpTo"
              placeholder="跳转至"
              clearable
              size="small"
              style="width: 100px"
              @change="(val) => setOptionJump(index, val)"
            >
              <el-option
                v-for="q in targetQuestions"
                :key="q.id"
                :label="q.title.substring(0, 15)"
                :value="props.questions.indexOf(q)"
              />
            </el-select>
            <el-button
              size="small"
              type="danger"
              text
              @click="deleteOption(index)"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
        <el-button type="primary" text @click="addOption">
          <el-icon><Plus /></el-icon>
          添加选项
        </el-button>
      </el-tab-pane>

      <el-tab-pane v-if="isRating" label="评分设置">
        <div class="form-group">
          <label>最大星数</label>
          <el-slider
            :model-value="localQuestion.settings.maxRating || 5"
            :min="3"
            :max="10"
            :marks="ratingMarks"
            @change="(val) => updateSetting('maxRating', val)"
          />
        </div>
      </el-tab-pane>

      <el-tab-pane v-if="isScale" label="量表设置">
        <div class="form-row">
          <div class="form-group">
            <label>最小值</label>
            <el-input-number
              :model-value="localQuestion.settings.minValue || 1"
              :min="0"
              :max="9"
              @change="(val) => updateSetting('minValue', val)"
            />
          </div>
          <div class="form-group">
            <label>最大值</label>
            <el-input-number
              :model-value="localQuestion.settings.maxValue || 10"
              :min="2"
              :max="10"
              @change="(val) => updateSetting('maxValue', val)"
            />
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane v-if="isText" label="文本设置">
        <div class="form-group">
          <label>占位文本</label>
          <el-input
            :model-value="localQuestion.settings.placeholder"
            placeholder="请输入占位提示"
            @blur="(e) => updateSetting('placeholder', (e.target as HTMLInputElement).value)"
          />
        </div>
        <div class="form-group">
          <label>最大字数</label>
          <el-input-number
            :model-value="localQuestion.settings.maxLength || 500"
            :min="10"
            :max="5000"
            :step="10"
            @change="(val) => updateSetting('maxLength', val)"
          />
        </div>
        <div class="form-group">
          <label>行数</label>
          <el-input-number
            :model-value="localQuestion.settings.rows || 4"
            :min="1"
            :max="20"
            @change="(val) => updateSetting('rows', val)"
          />
        </div>
      </el-tab-pane>

      <el-tab-pane v-if="isMatrix" label="矩阵设置">
        <div class="form-group">
          <label>行选项</label>
          <div
            v-for="(row, index) in localQuestion.settings.matrixRows"
            :key="'row-' + index"
            class="matrix-item"
          >
            <el-input
              v-model="localQuestion.settings.matrixRows![index]"
              size="small"
              @blur="updateMatrixRows([...localQuestion.settings.matrixRows!])"
            />
            <el-button
              size="small"
              type="danger"
              text
              @click="() => {
                const rows = [...(localQuestion.settings.matrixRows || [])]
                rows.splice(index, 1)
                updateMatrixRows(rows)
              }"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
          <el-button size="small" @click="addMatrixRow">添加行</el-button>
        </div>
        <div class="form-group">
          <label>列选项</label>
          <div
            v-for="(col, index) in localQuestion.settings.matrixCols"
            :key="'col-' + index"
            class="matrix-item"
          >
            <el-input
              v-model="localQuestion.settings.matrixCols![index]"
              size="small"
              @blur="updateMatrixCols([...localQuestion.settings.matrixCols!])"
            />
            <el-button
              size="small"
              type="danger"
              text
              @click="() => {
                const cols = [...(localQuestion.settings.matrixCols || [])]
                cols.splice(index, 1)
                updateMatrixCols(cols)
              }"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
          <el-button size="small" @click="addMatrixCol">添加列</el-button>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style lang="scss" scoped>
.property-panel {
  :deep(.el-tabs__header) {
    margin-bottom: 16px;
  }
}

.form-group {
  margin-bottom: 20px;

  label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-regular);
    margin-bottom: 8px;
  }
}

.form-row {
  display: flex;
  gap: 16px;

  .form-group {
    flex: 1;
  }
}

.switch-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: var(--bg-color);
  border-radius: 8px;
}

.options-list {
  margin-bottom: 16px;
}

.option-item {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;

  .el-input {
    flex: 1;
  }
}

.matrix-item {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;

  .el-input {
    flex: 1;
  }
}
</style>
