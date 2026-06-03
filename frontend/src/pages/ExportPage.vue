<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSurveyStore } from '@/stores/survey'
import { surveyApi } from '@/utils/api'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'
import type { SurveyResponse } from '@/types'

const route = useRoute()
const router = useRouter()
const store = useSurveyStore()
const loading = ref(false)
const responses = ref<SurveyResponse[]>([])
const surveyId = computed(() => route.params.id as string)

onMounted(async () => {
  await loadResponses()
})

async function loadResponses() {
  loading.value = true
  try {
    if (!store.currentSurvey || store.currentSurvey._id !== surveyId.value) {
      await surveyApi.get(surveyId.value)
    }
    responses.value = await surveyApi.getResponses(surveyId.value)
  } catch (error: any) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

function exportToExcel() {
  if (responses.value.length === 0) {
    ElMessage.warning('暂无数据可导出')
    return
  }

  const survey = store.currentSurvey!
  const headers = ['提交时间', ...survey.questions.map(q => q.title)]

  const data = responses.value.map(response => {
    const row = [response.submittedAt ? new Date(response.submittedAt).toLocaleString() : '']
    survey.questions.forEach(q => {
      const answer = response.answers.find(a => a.questionId === q.id)
      if (!answer || answer.value === null || answer.value === undefined) {
        row.push('')
      } else if (Array.isArray(answer.value)) {
        const texts = answer.value.map(v => {
          if (typeof v === 'string') {
            const option = q.options?.find(o => o.id === v)
            return option ? option.text : v
          }
          return String(v)
        })
        row.push(texts.join(', '))
      } else if (typeof answer.value === 'string') {
        const option = q.options?.find(o => o.id === answer.value)
        row.push(option ? option.text : answer.value)
      } else {
        row.push(String(answer.value))
      }
    })
    return row
  })

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '问卷数据')

  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `${survey.title}_数据导出.xlsx`)

  ElMessage.success('Excel 导出成功')
}

function exportChartAsImage(questionId: string, questionTitle: string) {
  const chartElement = document.querySelector(`#chart-${questionId} canvas`) as HTMLCanvasElement
  if (!chartElement) {
    ElMessage.error('图表不存在')
    return
  }

  chartElement.toBlob((blob) => {
    if (blob) {
      saveAs(blob, `${questionTitle}_图表.png`)
      ElMessage.success('图表导出成功')
    }
  })
}
</script>

<template>
  <div class="export-page">
    <header class="page-header">
      <el-button @click="router.push(`/analysis/${surveyId}`)">
        <el-icon><Back /></el-icon>
        返回
      </el-button>
      <h2>数据导出 - {{ store.currentSurvey?.title }}</h2>
      <div></div>
    </header>

    <div v-loading="loading" class="export-content">
      <el-card class="export-card">
        <template #header>
          <div class="card-header">
            <span>原始数据导出</span>
            <el-tag type="info">{{ responses.length }} 条记录</el-tag>
          </div>
        </template>
        <div class="export-info">
          <p>导出格式：Excel (.xlsx)</p>
          <p class="export-desc">包含所有答卷的原始数据，每行代表一份答卷</p>
        </div>
        <el-button type="primary" size="large" @click="exportToExcel">
          <el-icon><Download /></el-icon>
          导出 Excel
        </el-button>
      </el-card>

      <el-card class="export-card">
        <template #header>
          <div class="card-header">
            <span>图表导出</span>
          </div>
        </template>
        <div class="chart-list">
          <div
            v-for="question in store.currentSurvey?.questions"
            :key="question.id"
            class="chart-item"
          >
            <span class="chart-title">{{ question.title }}</span>
            <el-button size="small" @click="exportChartAsImage(question.id, question.title)">
              <el-icon><Download /></el-icon>
              导出图表
            </el-button>
          </div>
        </div>
      </el-card>

      <el-card class="export-card">
        <template #header>
          <div class="card-header">
            <span>数据预览</span>
          </div>
        </template>
        <el-table :data="responses.slice(0, 10)" stripe>
          <el-table-column type="index" width="60" label="#" />
          <el-table-column label="提交时间" width="180">
            <template #default="{ row }">
              {{ row.submittedAt ? new Date(row.submittedAt).toLocaleString() : '-' }}
            </template>
          </el-table-column>
          <el-table-column
            v-for="q in store.currentSurvey?.questions.slice(0, 5)"
            :key="q.id"
            :label="q.title"
            min-width="150"
          >
            <template #default="{ row }">
              {{ row.answers.find(a => a.questionId === q.id)?.value || '-' }}
            </template>
          </el-table-column>
        </el-table>
        <div v-if="responses.length > 10" class="more-hint">
          仅显示前 10 条记录，完整数据请导出 Excel
        </div>
      </el-card>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.export-page {
  min-height: 100vh;
  background: var(--bg-color);
}

.page-header {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid var(--border-color);

  h2 {
    flex: 1;
    margin: 0;
    font-size: 20px;
  }
}

.export-content {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.export-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .export-info {
    margin-bottom: 20px;

    p {
      margin: 0 0 8px 0;
      font-size: 14px;
      color: var(--text-regular);
    }

    .export-desc {
      color: var(--text-secondary);
      font-size: 13px;
    }
  }

  .chart-list {
    .chart-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid var(--border-color);

      &:last-child {
        border-bottom: none;
      }

      .chart-title {
        font-size: 14px;
        color: var(--text-primary);
      }
    }
  }

  .more-hint {
    text-align: center;
    padding: 16px;
    color: var(--text-secondary);
    font-size: 13px;
  }
}
</style>
