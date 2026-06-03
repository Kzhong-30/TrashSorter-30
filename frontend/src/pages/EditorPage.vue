<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSurveyStore } from '@/stores/survey'
import { surveyApi } from '@/utils/api'
import { ElMessage } from 'element-plus'
import draggable from 'vuedraggable'
import ComponentLibrary from '@/components/editor/ComponentLibrary.vue'
import QuestionCard from '@/components/editor/QuestionCard.vue'
import PropertyPanel from '@/components/editor/PropertyPanel.vue'
import type { Question, QuestionType } from '@/types'

const route = useRoute()
const router = useRouter()
const store = useSurveyStore()
const loading = ref(false)
const saving = ref(false)
const surveyId = computed(() => route.params.id as string)

const questions = ref<Question[]>([])

const questionTypes = [
  { type: 'radio', label: '单选', icon: 'CircleCheck' },
  { type: 'checkbox', label: '多选', icon: 'CopyDocument' },
  { type: 'dropdown', label: '下拉', icon: 'ArrowDown' },
  { type: 'rating', label: '评分', icon: 'Star' },
  { type: 'scale', label: '量表', icon: 'Scale' },
  { type: 'text', label: '文本', icon: 'Edit' },
  { type: 'date', label: '日期', icon: 'Calendar' },
  { type: 'matrix', label: '矩阵', icon: 'Grid' }
] as const

onMounted(async () => {
  await loadSurvey()
})

watch(surveyId, async () => {
  if (surveyId.value) {
    await loadSurvey()
  }
})

async function loadSurvey() {
  if (!surveyId.value) return
  loading.value = true
  try {
    const data = await surveyApi.get(surveyId.value)
    store.setCurrentSurvey(data)
    questions.value = [...(data.questions || [])]
  } catch (error: any) {
    ElMessage.error('加载问卷失败')
    router.push('/')
  } finally {
    loading.value = false
  }
}

function handleAddQuestion(type: QuestionType) {
  store.addQuestion(type)
  questions.value = [...store.currentSurvey!.questions]
}

function handleQuestionSelect(id: string) {
  store.selectQuestion(id)
}

function handleQuestionUpdate(question: Question) {
  store.updateQuestion(question.id, question)
  questions.value = [...store.currentSurvey!.questions]
}

function handleQuestionDelete(id: string) {
  store.deleteQuestion(id)
  questions.value = [...store.currentSurvey!.questions]
}

function handleDragChange(evt: any) {
  if (evt.moved) {
    store.reorderQuestions(questions.value)
  }
}

async function saveSurvey() {
  if (!store.currentSurvey) return
  saving.value = true
  try {
    await surveyApi.update(surveyId.value, {
      ...store.currentSurvey,
      questions: questions.value
    })
    ElMessage.success('保存成功')
  } catch (error: any) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

function handleSettings() {
  router.push(`/settings/${surveyId.value}`)
}

function handlePreview() {
  router.push(`/preview/${surveyId.value}`)
}

function handlePublish() {
  router.push(`/settings/${surveyId.value}`)
}
</script>

<template>
  <div class="editor-page">
    <header class="editor-header">
      <div class="header-left">
        <el-button @click="router.push('/')">
          <el-icon><Back /></el-icon>
          返回
        </el-button>
        <el-input
          v-model="store.currentSurvey!.title"
          class="title-input"
          placeholder="请输入问卷标题"
          @change="saveSurvey"
        />
      </div>
      <div class="header-right">
        <el-button @click="handleSettings">问卷设置</el-button>
        <el-button @click="handlePreview">预览</el-button>
        <el-button type="primary" :loading="saving" @click="saveSurvey">
          保存
        </el-button>
        <el-button type="success" @click="handlePublish">发布</el-button>
      </div>
    </header>

    <div class="editor-body">
      <aside class="component-library">
        <h3 class="panel-title">组件库</h3>
        <ComponentLibrary @add="handleAddQuestion" />
      </aside>

      <main class="canvas-area">
        <div class="canvas-container">
          <div v-if="questions.length === 0" class="empty-canvas">
            <el-icon class="empty-icon"><DocumentAdd /></el-icon>
            <p>从左侧拖拽或点击组件添加题目</p>
          </div>
          <draggable
            v-model="questions"
            item-key="id"
            handle=".drag-handle"
            ghost-class="draggable-ghost"
            chosen-class="draggable-chosen"
            animation="300"
            @change="handleDragChange"
          >
            <template #item="{ element }">
              <QuestionCard
                :question="element"
                :selected="store.selectedQuestionId === element.id"
                @select="handleQuestionSelect"
                @update="handleQuestionUpdate"
                @delete="handleQuestionDelete"
              />
            </template>
          </draggable>
        </div>
      </main>

      <aside class="property-panel">
        <h3 class="panel-title">属性配置</h3>
        <PropertyPanel
          v-if="store.selectedQuestion"
          :question="store.selectedQuestion"
          :questions="questions"
          @update="handleQuestionUpdate"
        />
        <div v-else class="no-selection">
          <el-empty description="请选择一个题目" />
        </div>
      </aside>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.editor-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-color);
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: white;
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow-light);

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;

    .title-input {
      width: 400px;

      :deep(.el-input__inner) {
        font-size: 18px;
        font-weight: 600;
        border: none;
        background: transparent;

        &:focus {
          background: var(--bg-color);
          border-radius: 8px;
          padding: 8px 12px;
        }
      }
    }
  }

  .header-right {
    display: flex;
    gap: 12px;
  }
}

.editor-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.component-library {
  width: 260px;
  background: white;
  border-right: 1px solid var(--border-color);
  padding: 16px;
  overflow-y: auto;
}

.canvas-area {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.canvas-container {
  max-width: 800px;
  margin: 0 auto;
  min-height: 100%;

  .empty-canvas {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    border: 2px dashed var(--border-color);
    border-radius: 12px;
    color: var(--text-secondary);

    .empty-icon {
      font-size: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    p {
      font-size: 16px;
    }
  }
}

.property-panel {
  width: 320px;
  background: white;
  border-left: 1px solid var(--border-color);
  padding: 16px;
  overflow-y: auto;

  .no-selection {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 300px;
  }
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 16px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

:deep(.draggable-ghost) {
  opacity: 0.5;
  background: #409EFF;
  border-radius: 8px;
}

:deep(.draggable-chosen) {
  box-shadow: var(--shadow);
}
</style>
