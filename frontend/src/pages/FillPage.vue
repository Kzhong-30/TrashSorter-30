<script setup lang="ts">
import { ref, computed, onMounted, provide } from 'vue'
import { useRoute } from 'vue-router'
import { useSurveyStore } from '@/stores/survey'
import { surveyApi } from '@/utils/api'
import { ElMessage } from 'element-plus'
import QuestionForm from '@/components/form/QuestionForm.vue'
import type { Survey, Question, Answer, AnswerValue } from '@/types'
import { calculateProgress } from '@/utils/helpers'

const route = useRoute()
const store = useSurveyStore()
const surveyId = computed(() => route.params.id as string)

const loading = ref(true)
const submitting = ref(false)
const survey = ref<Survey | null>(null)
const answers = ref<Record<string, AnswerValue>>({})
const currentQuestionIndex = ref(0)
const submitted = ref(false)
const validationError = ref('')

const visibleQuestions = computed(() => {
  if (!survey.value) return []
  return survey.value.questions
})

const progress = computed(() => {
  if (!survey.value || survey.value.questions.length === 0) return 0
  return calculateProgress(currentQuestionIndex.value, survey.value.questions.length)
})

const isValid = computed(() => {
  if (!survey.value) return false
  const requiredQuestions = survey.value.questions.filter(q => q.required)
  return requiredQuestions.every(q => {
    const answer = answers.value[q.id]
    if (q.type === 'checkbox') {
      return Array.isArray(answer) && answer.length > 0
    }
    return answer !== null && answer !== undefined && answer !== ''
  })
})

onMounted(async () => {
  await loadSurvey()
})

async function loadSurvey() {
  loading.value = true
  try {
    const data = await surveyApi.get(surveyId.value)
    survey.value = data

    const validation = await surveyApi.validate(surveyId.value)
    if (!validation.canFill) {
      validationError.value = validation.reason || '您已完成此问卷'
      return
    }

    data.questions.forEach(q => {
      if (q.type === 'checkbox') {
        answers.value[q.id] = []
      } else {
        answers.value[q.id] = null
      }
    })
  } catch (error: any) {
    validationError.value = '问卷加载失败'
  } finally {
    loading.value = false
  }
}

function handleAnswerUpdate(questionId: string, value: AnswerValue) {
  answers.value[questionId] = value
}

function nextQuestion() {
  if (currentQuestionIndex.value < visibleQuestions.value.length - 1) {
    currentQuestionIndex.value++
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function prevQuestion() {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function getNextJump(question: Question): number | null {
  if (!question.options) return null
  const answer = answers.value[question.id]
  if (typeof answer !== 'string') return null
  
  const selectedOption = question.options.find(o => o.id === answer)
  if (selectedOption?.jumpTo !== undefined) {
    return selectedOption.jumpTo
  }
  return null
}

async function handleSubmit() {
  if (!isValid.value) {
    ElMessage.warning('请完成所有必填题目')
    return
  }

  submitting.value = true
  try {
    const answerList: Answer[] = Object.entries(answers.value).map(([questionId, value]) => ({
      questionId,
      value
    }))

    await surveyApi.submitResponse(surveyId.value, answerList)
    submitted.value = true
  } catch (error: any) {
    ElMessage.error(error.message || '提交失败')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="fill-page">
    <div v-if="loading" class="loading-state">
      <el-icon class="is-loading"><Loading /></el-icon>
      <p>加载中...</p>
    </div>

    <div v-else-if="validationError" class="error-state">
      <el-result
        icon="warning"
        :title="validationError"
      >
        <template #extra>
          <el-button @click="$router.push('/')">返回首页</el-button>
        </template>
      </el-result>
    </div>

    <div v-else-if="submitted" class="submitted-state">
      <el-result
        icon="success"
        :title="survey?.endMessage || '感谢您的参与！'"
        sub-title="您的答案已成功提交"
      >
        <template #extra>
          <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
        </template>
      </el-result>
    </div>

    <div v-else-if="survey" class="survey-container">
      <div class="survey-header">
        <h1>{{ survey.title }}</h1>
        <p v-if="survey.description" class="description">{{ survey.description }}</p>
        <p class="welcome">{{ survey.welcomeMessage }}</p>
      </div>

      <div class="progress-bar">
        <div class="progress-info">
          <span>进度</span>
          <span>{{ progress }}%</span>
        </div>
        <el-progress :percentage="progress" :show-text="false" />
      </div>

      <div class="questions-area">
        <transition-group name="slide-fade">
          <div
            v-for="(question, index) in visibleQuestions"
            v-show="index === currentQuestionIndex"
            :key="question.id"
            class="question-wrapper"
          >
            <QuestionForm
              :question="question"
              :index="index"
              :model-value="answers[question.id]"
              @update:model-value="(val) => handleAnswerUpdate(question.id, val)"
            />
          </div>
        </transition-group>
      </div>

      <div class="navigation">
        <el-button
          v-if="currentQuestionIndex > 0"
          @click="prevQuestion"
        >
          <el-icon><ArrowLeft /></el-icon>
          上一题
        </el-button>
        <div v-else></div>

        <span class="page-info">
          {{ currentQuestionIndex + 1 }} / {{ visibleQuestions.length }}
        </span>

        <el-button
          v-if="currentQuestionIndex < visibleQuestions.length - 1"
          type="primary"
          @click="nextQuestion"
        >
          下一题
          <el-icon><ArrowRight /></el-icon>
        </el-button>
        <el-button
          v-else
          type="success"
          :loading="submitting"
          @click="handleSubmit"
        >
          提交问卷
        </el-button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.fill-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f5f7fa 0%, #ffffff 100%);
  padding: 0 16px 60px;
}

.loading-state, .error-state, .submitted-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;

  .is-loading {
    font-size: 48px;
    color: var(--primary-color);
    animation: rotate 2s linear infinite;
  }

  p {
    margin-top: 16px;
    color: var(--text-secondary);
  }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.survey-container {
  max-width: 800px;
  margin: 0 auto;
}

.survey-header {
  text-align: center;
  padding: 48px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 0 0 24px 24px;
  color: white;
  margin-bottom: 0;

  h1 {
    font-size: 28px;
    margin: 0 0 16px 0;
    font-weight: 600;
  }

  .description {
    font-size: 15px;
    margin: 0 0 12px 0;
    opacity: 0.9;
  }

  .welcome {
    font-size: 14px;
    margin: 0;
    padding-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    opacity: 0.85;
  }
}

.progress-bar {
  background: white;
  padding: 16px 24px;
  border-radius: 0 0 16px 16px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

  .progress-info {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    color: var(--text-secondary);
    margin-bottom: 8px;
  }
}

.questions-area {
  background: white;
  border-radius: 16px;
  box-shadow: var(--shadow);
  overflow: hidden;
}

.question-wrapper {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.slide-fade-enter-active {
  transition: all 0.3s ease;
}

.slide-fade-leave-active {
  transition: all 0.2s ease;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  padding: 16px 0;

  .page-info {
    font-size: 14px;
    color: var(--text-secondary);
  }
}

@media (max-width: 768px) {
  .survey-header {
    padding: 32px 16px;
    border-radius: 0 0 16px 16px;

    h1 {
      font-size: 22px;
    }
  }
}
</style>
