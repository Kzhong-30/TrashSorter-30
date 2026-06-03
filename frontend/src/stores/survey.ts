import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Survey, Question } from '@/types'
import { generateId } from '@/utils/helpers'
import { surveyApi } from '@/utils/api'

export const useSurveyStore = defineStore('survey', () => {
  const surveys = ref<Survey[]>([])
  const currentSurvey = ref<Survey | null>(null)
  const selectedQuestionId = ref<string | null>(null)

  const selectedQuestion = computed(() => {
    if (!currentSurvey.value || !selectedQuestionId.value) return null
    return currentSurvey.value.questions.find(q => q.id === selectedQuestionId.value) || null
  })

  const draftSurveys = computed(() => surveys.value.filter(s => s.status === 'draft'))
  const publishedSurveys = computed(() => surveys.value.filter(s => s.status === 'published'))
  const closedSurveys = computed(() => surveys.value.filter(s => s.status === 'closed'))

  async function loadSurveys() {
    try {
      const data = await surveyApi.list()
      surveys.value = data
    } catch (error) {
      console.error('Load surveys failed:', error)
    }
  }

  function setSurveys(data: Survey[]) {
    surveys.value = data
  }

  function setCurrentSurvey(survey: Survey | null) {
    currentSurvey.value = survey
    selectedQuestionId.value = null
  }

  function selectQuestion(id: string | null) {
    selectedQuestionId.value = id
  }

  function createSurvey(): Survey {
    const newSurvey: Survey = {
      _id: generateId(),
      title: '未命名问卷',
      description: '',
      welcomeMessage: '欢迎参加本次问卷调查',
      endMessage: '感谢您的参与！',
      startTime: null,
      endTime: null,
      maxResponses: null,
      isAnonymous: true,
      status: 'draft',
      questions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    surveys.value.unshift(newSurvey)
    return newSurvey
  }

  function addQuestion(type: Question['type']) {
    if (!currentSurvey.value) return

    const question: Question = {
      id: generateId(),
      type,
      title: '请输入题目',
      description: '',
      required: false,
      options: ['radio', 'checkbox', 'dropdown'].includes(type) ? [
        { id: generateId(), text: '选项 1' },
        { id: generateId(), text: '选项 2' }
      ] : undefined,
      settings: getDefaultSettings(type),
      logic: []
    }

    currentSurvey.value.questions.push(question)
    selectedQuestionId.value = question.id
    currentSurvey.value.updatedAt = new Date().toISOString()
  }

  function updateQuestion(questionId: string, updates: Partial<Question>) {
    if (!currentSurvey.value) return

    const index = currentSurvey.value.questions.findIndex(q => q.id === questionId)
    if (index !== -1) {
      currentSurvey.value.questions[index] = {
        ...currentSurvey.value.questions[index],
        ...updates
      }
      currentSurvey.value.updatedAt = new Date().toISOString()
    }
  }

  function deleteQuestion(questionId: string) {
    if (!currentSurvey.value) return

    currentSurvey.value.questions = currentSurvey.value.questions.filter(q => q.id !== questionId)
    if (selectedQuestionId.value === questionId) {
      selectedQuestionId.value = null
    }
    currentSurvey.value.updatedAt = new Date().toISOString()
  }

  function reorderQuestions(newQuestions: Question[]) {
    if (!currentSurvey.value) return
    currentSurvey.value.questions = newQuestions
    currentSurvey.value.updatedAt = new Date().toISOString()
  }

  function updateSurvey(updates: Partial<Survey>) {
    if (!currentSurvey.value) return
    currentSurvey.value = { ...currentSurvey.value, ...updates, updatedAt: new Date().toISOString() }
  }

  function updateSurveyInList(surveyId: string, updates: Partial<Survey>) {
    const index = surveys.value.findIndex(s => s._id === surveyId)
    if (index !== -1) {
      surveys.value[index] = { ...surveys.value[index], ...updates }
    }
  }

  return {
    surveys,
    currentSurvey,
    selectedQuestionId,
    selectedQuestion,
    draftSurveys,
    publishedSurveys,
    closedSurveys,
    loadSurveys,
    setSurveys,
    setCurrentSurvey,
    selectQuestion,
    createSurvey,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    reorderQuestions,
    updateSurvey,
    updateSurveyInList
  }
})

function getDefaultSettings(type: Question['type']): Question['settings'] {
  switch (type) {
    case 'radio':
    case 'checkbox':
    case 'dropdown':
      return {}
    case 'rating':
      return { minRating: 1, maxRating: 5, ratingLabels: ['非常不满意', '不满意', '一般', '满意', '非常满意'] }
    case 'scale':
      return { minValue: 1, maxValue: 10, step: 1 }
    case 'text':
      return { placeholder: '请输入...', rows: 4, maxLength: 500 }
    case 'date':
      return { format: 'YYYY-MM-DD' }
    case 'matrix':
      return { matrixRows: ['行 1', '行 2'], matrixCols: ['列 1', '列 2', '列 3'] }
    default:
      return {}
  }
}
