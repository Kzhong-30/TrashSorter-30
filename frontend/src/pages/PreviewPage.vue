<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSurveyStore } from '@/stores/survey'
import { surveyApi } from '@/utils/api'
import QuestionForm from '@/components/form/QuestionForm.vue'

const route = useRoute()
const router = useRouter()
const store = useSurveyStore()
const loading = ref(false)
const surveyId = computed(() => route.params.id as string)

onMounted(async () => {
  if (!store.currentSurvey || store.currentSurvey._id !== surveyId.value) {
    loading.value = true
    try {
      const data = await surveyApi.get(surveyId.value)
      store.setCurrentSurvey(data)
    } catch (error) {
      router.push('/')
    } finally {
      loading.value = false
    }
  }
})
</script>

<template>
  <div class="preview-page">
    <header class="preview-header">
      <el-button @click="router.back()">
        <el-icon><Back /></el-icon>
        返回
      </el-button>
      <h2>问卷预览</h2>
      <div></div>
    </header>

    <div v-loading="loading" class="preview-content">
      <div v-if="store.currentSurvey" class="survey-preview">
        <div class="welcome-section">
          <h1>{{ store.currentSurvey.title }}</h1>
          <p v-if="store.currentSurvey.description">{{ store.currentSurvey.description }}</p>
          <p class="welcome-message">{{ store.currentSurvey.welcomeMessage }}</p>
        </div>

        <div class="questions-section">
          <QuestionForm
            v-for="(question, index) in store.currentSurvey.questions"
            :key="question.id"
            :question="question"
            :index="index"
            :readonly="true"
          />
        </div>

        <div v-if="store.currentSurvey.questions.length === 0" class="empty-questions">
          <el-empty description="暂无题目" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.preview-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f0f2f5 0%, #ffffff 100%);
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid var(--border-color);

  h2 {
    margin: 0;
    font-size: 18px;
  }
}

.preview-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 24px;
}

.survey-preview {
  background: white;
  border-radius: 16px;
  box-shadow: var(--shadow);
  overflow: hidden;
}

.welcome-section {
  padding: 48px 40px;
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;

  h1 {
    font-size: 28px;
    margin: 0 0 16px 0;
    font-weight: 600;
  }

  p {
    font-size: 15px;
    line-height: 1.6;
    margin: 0;
  }

  .welcome-message {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
  }
}

.questions-section {
  padding: 32px 40px;
}

.empty-questions {
  padding: 60px 0;
}
</style>
