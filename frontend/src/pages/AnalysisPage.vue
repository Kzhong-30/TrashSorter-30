<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSurveyStore } from '@/stores/survey'
import { surveyApi } from '@/utils/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'
import { getTextFrequency } from '@/utils/helpers'
import type { Statistics, QuestionStatistics } from '@/types'

const route = useRoute()
const router = useRouter()
const store = useSurveyStore()
const loading = ref(true)
const statistics = ref<Statistics | null>(null)
const surveyId = computed(() => route.params.id as string)

const crossQuestion1 = ref('')
const crossQuestion2 = ref('')
const crossTable = ref<any[][]>([])
const showCrossAnalysis = ref(false)

const chartRefs = ref<Record<string, HTMLElement>>({})
const charts = ref<Record<string, echarts.ECharts>>({})

onMounted(async () => {
  await loadStatistics()
})

async function loadStatistics() {
  loading.value = true
  try {
    if (!store.currentSurvey || store.currentSurvey._id !== surveyId.value) {
      const survey = await surveyApi.get(surveyId.value)
      store.setCurrentSurvey(survey)
    }
    statistics.value = await surveyApi.getStatistics(surveyId.value)
    await nextTick()
    initCharts()
  } catch (error: any) {
    ElMessage.error('加载统计数据失败')
  } finally {
    loading.value = false
  }
}

function initCharts() {
  if (!statistics.value) return

  statistics.value.questionStats.forEach(stat => {
    if (['radio', 'checkbox', 'dropdown', 'rating', 'scale'].includes(stat.type)) {
      nextTick(() => {
        renderBarChart(stat)
      })
    }
  })
}

function renderBarChart(stat: QuestionStatistics) {
  const element = chartRefs.value[stat.questionId]
  if (!element) return

  let chart = charts.value[stat.questionId]
  if (!chart) {
    chart = echarts.init(element)
    charts.value[stat.questionId] = chart
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: stat.distribution.map(d => d.label),
      axisLabel: {
        rotate: stat.distribution.length > 6 ? 30 : 0,
        fontSize: 11
      }
    },
    yAxis: {
      type: 'value',
      name: '人次'
    },
    series: [{
      type: 'bar',
      data: stat.distribution.map(d => ({
        value: d.count,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#409EFF' },
            { offset: 1, color: '#66b1ff' }
          ])
        }
      })),
      barRadius: 4,
      label: {
        show: true,
        position: 'top',
        formatter: (params: any) => `${params.value} (${stat.distribution[params.dataIndex].percentage}%)`,
        fontSize: 11
      }
    }]
  }

  chart.setOption(option)
}

function getTextStats(stat: QuestionStatistics): { word: string; count: number }[] {
  if (!stat.textAnswers) return []
  return getTextFrequency(stat.textAnswers, 10)
}

async function performCrossAnalysis() {
  if (!crossQuestion1.value || !crossQuestion2.value) {
    ElMessage.warning('请选择两个题目进行交叉分析')
    return
  }

  try {
    const responses = await surveyApi.getResponses(surveyId.value)
    const survey = store.currentSurvey!
    const q1 = survey.questions.find(q => q.id === crossQuestion1.value)!
    const q2 = survey.questions.find(q => q.id === crossQuestion2.value)!

    const q1Options = q1.options?.map(o => o.text) || ['评分']
    const q2Options = q2.options?.map(o => o.text) || ['评分']

    const matrix: number[][] = Array(q1Options.length).fill(0).map(() =>
      Array(q2Options.length).fill(0)
    )

    responses.forEach(response => {
      const a1 = response.answers.find(a => a.questionId === crossQuestion1.value)
      const a2 = response.answers.find(a => a.questionId === crossQuestion2.value)
      if (a1 && a2) {
        const v1 = q1.options?.findIndex(o => o.id === a1.value) ?? (a1.value as number)
        const v2 = q2.options?.findIndex(o => o.id === a2.value) ?? (a2.value as number)
        if (v1 >= 0 && v2 >= 0) {
          matrix[v1][v2]++
        }
      }
    })

    crossTable.value = matrix
    showCrossAnalysis.value = true
  } catch (error: any) {
    ElMessage.error('交叉分析失败')
  }
}
</script>

<template>
  <div class="analysis-page">
    <header class="page-header">
      <el-button @click="router.push('/')">
        <el-icon><Back /></el-icon>
        返回
      </el-button>
      <h2>数据分析 - {{ store.currentSurvey?.title }}</h2>
      <el-button type="primary" @click="router.push(`/export/${surveyId}`)">
        <el-icon><Download /></el-icon>
        导出数据
      </el-button>
    </header>

    <div v-loading="loading" class="analysis-content">
      <div v-if="statistics" class="stats-overview">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #409EFF, #66b1ff)">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ statistics.totalResponses }}</span>
              <span class="stat-label">总填写人数</span>
            </div>
          </div>
        </el-card>
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #67C23A, #85ce61)">
              <el-icon><QuestionFilled /></el-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ store.currentSurvey?.questions.length }}</span>
              <span class="stat-label">题目数量</span>
            </div>
          </div>
        </el-card>
      </div>

      <div v-if="statistics" class="question-stats">
        <el-card
          v-for="stat in statistics.questionStats"
          :key="stat.questionId"
          class="question-stat-card"
        >
          <template #header>
            <div class="card-header">
              <span>{{ stat.title }}</span>
              <el-tag size="small" type="info">{{ stat.totalAnswers }} 人回答</el-tag>
            </div>
          </template>

          <div v-if="['radio', 'checkbox', 'dropdown'].includes(stat.type)" class="chart-container">
            <div :ref="(el) => { if (el) chartRefs[stat.questionId] = el as HTMLElement }" class="chart"></div>
          </div>

          <div v-else-if="['rating', 'scale'].includes(stat.type)" class="rating-stats">
            <div class="average-score">
              <span class="score">{{ stat.average?.toFixed(1) || '-' }}</span>
              <span class="label">平均分</span>
            </div>
            <div class="distribution">
              <div
                v-for="item in stat.distribution"
                :key="item.label"
                class="dist-item"
              >
                <span class="dist-label">{{ item.label }}</span>
                <div class="dist-bar">
                  <div
                    class="dist-fill"
                    :style="{ width: `${item.percentage}%` }"
                  ></div>
                </div>
                <span class="dist-value">{{ item.count }} ({{ item.percentage }}%)</span>
              </div>
            </div>
          </div>

          <div v-else-if="stat.type === 'text'" class="text-stats">
            <h4>高频词统计</h4>
            <div v-if="getTextStats(stat).length > 0" class="word-cloud">
              <el-tag
                v-for="(item, index) in getTextStats(stat)"
                :key="item.word"
                :type="index < 3 ? 'primary' : 'info'"
                size="large"
                class="word-tag"
              >
                {{ item.word }} ({{ item.count }})
              </el-tag>
            </div>
            <el-empty v-else description="暂无文本数据" :image-size="60" />
          </div>

          <div v-else-if="stat.type === 'date'" class="date-stats">
            <el-table :data="stat.distribution.slice(0, 10)" stripe>
              <el-table-column prop="label" label="日期" />
              <el-table-column prop="count" label="选择次数" />
              <el-table-column prop="percentage" label="占比">
                <template #default="{ row }">
                  {{ row.percentage }}%
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div v-else-if="stat.type === 'matrix'" class="matrix-stats">
            <el-table :data="stat.distribution" stripe size="small">
              <el-table-column prop="label" label="选项" />
              <el-table-column prop="count" label="选择次数" />
              <el-table-column prop="percentage" label="占比">
                <template #default="{ row }">
                  <el-progress :percentage="row.percentage" :stroke-width="12" />
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </div>

      <el-card class="cross-analysis-card">
        <template #header>
          <div class="card-header">
            <span>交叉分析</span>
            <el-button type="primary" size="small" @click="performCrossAnalysis">
              分析
            </el-button>
          </div>
        </template>
        <div class="cross-select">
          <el-select v-model="crossQuestion1" placeholder="选择题目1" style="width: 300px">
            <el-option
              v-for="q in store.currentSurvey?.questions"
              :key="q.id"
              :label="q.title"
              :value="q.id"
            />
          </el-select>
          <span class="cross-vs">×</span>
          <el-select v-model="crossQuestion2" placeholder="选择题目2" style="width: 300px">
            <el-option
              v-for="q in store.currentSurvey?.questions"
              :key="q.id"
              :label="q.title"
              :value="q.id"
            />
          </el-select>
        </div>

        <div v-if="showCrossAnalysis && crossTable.length > 0" class="cross-table">
          <p class="table-note">* 表格中的数字表示同时选择两个选项的人数</p>
          <el-table :data="crossTable" border>
            <el-table-column
              v-for="(col, index) in store.currentSurvey?.questions.find(q => q.id === crossQuestion2.value)?.options"
              :key="index"
              :label="(col as any).text"
              align="center"
            >
              <template #default="{ row }">
                {{ row[index] }}
              </template>
            </el-table-column>
            <el-table-column label="总计" align="center" width="80">
              <template #default="{ row }">
                {{ row.reduce((a, b) => a + b, 0) }}
              </template>
            </el-table-column>
          </el-table>
          <div class="row-labels">
            <div
              v-for="(option, index) in store.currentSurvey?.questions.find(q => q.id === crossQuestion1.value)?.options"
              :key="index"
              class="row-label"
            >
              {{ (option as any).text }}
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.analysis-page {
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

.analysis-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
  margin-bottom: 24px;

  .stat-card {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 8px;

    .stat-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 64px;
      height: 64px;
      border-radius: 16px;
      color: white;
      font-size: 28px;
    }

    .stat-info {
      display: flex;
      flex-direction: column;

      .stat-value {
        font-size: 32px;
        font-weight: 700;
        color: var(--text-primary);
      }

      .stat-label {
        font-size: 14px;
        color: var(--text-secondary);
      }
    }
  }
}

.question-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}

.question-stat-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .chart-container {
    .chart {
      width: 100%;
      height: 300px;
    }
  }

  .rating-stats {
    .average-score {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
      background: var(--bg-color);
      border-radius: 12px;
      margin-bottom: 20px;

      .score {
        font-size: 48px;
        font-weight: 700;
        color: var(--primary-color);
      }

      .label {
        font-size: 14px;
        color: var(--text-secondary);
      }
    }

    .distribution {
      .dist-item {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;

        .dist-label {
          width: 60px;
          font-size: 13px;
          color: var(--text-secondary);
        }

        .dist-bar {
          flex: 1;
          height: 8px;
          background: var(--bg-color);
          border-radius: 4px;
          overflow: hidden;

          .dist-fill {
            height: 100%;
            background: linear-gradient(90deg, #409EFF, #66b1ff);
            border-radius: 4px;
            transition: width 0.5s ease;
          }
        }

        .dist-value {
          width: 120px;
          font-size: 12px;
          color: var(--text-secondary);
          text-align: right;
        }
      }
    }
  }

  .text-stats {
    h4 {
      margin: 0 0 16px 0;
      font-size: 14px;
      color: var(--text-secondary);
    }

    .word-cloud {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      .word-tag {
        margin: 4px;
      }
    }
  }
}

.cross-analysis-card {
  .cross-select {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;

    .cross-vs {
      font-size: 24px;
      font-weight: 700;
      color: var(--primary-color);
    }
  }

  .cross-table {
    margin-top: 20px;
    position: relative;

    .table-note {
      font-size: 12px;
      color: var(--text-secondary);
      margin: 0 0 12px 0;
    }

    .row-labels {
      display: none;
    }
  }
}
</style>
