<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSurveyStore } from '@/stores/survey'
import { surveyApi } from '@/utils/api'
import { formatDate, getSurveyStatus } from '@/utils/helpers'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Survey } from '@/types'

const router = useRouter()
const store = useSurveyStore()
const loading = ref(false)
const searchKeyword = ref('')
const statusFilter = ref<string>('')

const filteredSurveys = ref<Survey[]>([])

onMounted(async () => {
  await loadSurveys()
})

async function loadSurveys() {
  loading.value = true
  try {
    const data = await surveyApi.list()
    store.setSurveys(data)
    filterSurveys()
  } catch (error: any) {
    ElMessage.error('加载问卷列表失败')
  } finally {
    loading.value = false
  }
}

function filterSurveys() {
  let result = [...store.surveys]
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(s => s.title.toLowerCase().includes(keyword))
  }
  if (statusFilter.value) {
    result = result.filter(s => s.status === statusFilter.value)
  }
  filteredSurveys.value = result
}

function handleCreate() {
  const survey = store.createSurvey()
  router.push(`/editor/${survey._id}`)
}

function handleEdit(survey: Survey) {
  store.setCurrentSurvey(survey)
  router.push(`/editor/${survey._id}`)
}

function handleSettings(survey: Survey) {
  store.setCurrentSurvey(survey)
  router.push(`/settings/${survey._id}`)
}

function handlePreview(survey: Survey) {
  store.setCurrentSurvey(survey)
  router.push(`/preview/${survey._id}`)
}

function handleFill(survey: Survey) {
  window.open(`/fill/${survey._id}`, '_blank')
}

function handleAnalysis(survey: Survey) {
  store.setCurrentSurvey(survey)
  router.push(`/analysis/${survey._id}`)
}

function handleExport(survey: Survey) {
  store.setCurrentSurvey(survey)
  router.push(`/export/${survey._id}`)
}

async function handlePublish(survey: Survey) {
  try {
    await surveyApi.publish(survey._id!)
    store.updateSurveyInList(survey._id!, { status: 'published' })
    ElMessage.success('问卷发布成功')
  } catch (error: any) {
    ElMessage.error('发布失败')
  }
}

async function handleClose(survey: Survey) {
  try {
    await surveyApi.close(survey._id!)
    store.updateSurveyInList(survey._id!, { status: 'closed' })
    ElMessage.success('问卷已结束')
  } catch (error: any) {
    ElMessage.error('操作失败')
  }
}

async function handleDelete(survey: Survey) {
  try {
    await ElMessageBox.confirm('删除后无法恢复，确定要删除吗？', '警告', {
      type: 'warning'
    })
    await surveyApi.delete(survey._id!)
    store.surveys = store.surveys.filter(s => s._id !== survey._id)
    filterSurveys()
    ElMessage.success('删除成功')
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

function getShareUrl(survey: Survey): string {
  return `${window.location.origin}/fill/${survey._id}`
}
</script>

<template>
  <div class="page-container">
    <div class="main-content">
      <div class="header-section">
        <div class="title-area">
          <h1 class="main-title">问卷星</h1>
          <p class="subtitle">专业的在线问卷调研平台</p>
        </div>
        <el-button type="primary" size="large" @click="handleCreate" class="create-btn">
          <el-icon><Plus /></el-icon>
          创建问卷
        </el-button>
      </div>

      <div class="filter-section">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索问卷..."
          prefix-icon="Search"
          clearable
          @input="filterSurveys"
          class="search-input"
        />
        <el-select v-model="statusFilter" placeholder="状态筛选" clearable @change="filterSurveys">
          <el-option label="草稿" value="draft" />
          <el-option label="已发布" value="published" />
          <el-option label="已结束" value="closed" />
        </el-select>
      </div>

      <div v-loading="loading" class="survey-grid">
        <div
          v-for="survey in filteredSurveys"
          :key="survey._id"
          class="survey-card"
        >
          <div class="card-header">
            <h3 class="survey-title">{{ survey.title }}</h3>
            <el-tag :type="getSurveyStatus(survey.status).type" size="small">
              {{ getSurveyStatus(survey.status).label }}
            </el-tag>
          </div>
          <p class="survey-desc">{{ survey.description || '暂无描述' }}</p>
          <div class="survey-meta">
            <span class="meta-item">
              <el-icon><QuestionFilled /></el-icon>
              {{ survey.questions?.length || 0 }} 题
            </span>
            <span class="meta-item">
              <el-icon><Calendar /></el-icon>
              {{ formatDate(survey.createdAt!) }}
            </span>
          </div>
          <div class="card-actions">
            <el-button-group>
              <el-button size="small" @click="handleEdit(survey)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button size="small" @click="handleSettings(survey)">
                <el-icon><Setting /></el-icon>
                设置
              </el-button>
              <el-button size="small" @click="handlePreview(survey)">
                <el-icon><View /></el-icon>
                预览
              </el-button>
            </el-button-group>
            <el-button-group v-if="survey.status === 'published'">
              <el-button size="small" type="primary" @click="handleFill(survey)">
                <el-icon><Link /></el-icon>
                填写
              </el-button>
              <el-button size="small" type="success" @click="handleAnalysis(survey)">
                <el-icon><DataAnalysis /></el-icon>
                分析
              </el-button>
              <el-button size="small" type="warning" @click="handleExport(survey)">
                <el-icon><Download /></el-icon>
                导出
              </el-button>
              <el-button size="small" type="danger" @click="handleClose(survey)">
                结束
              </el-button>
            </el-button-group>
            <el-button-group v-if="survey.status === 'draft'">
              <el-button size="small" type="success" @click="handlePublish(survey)">
                <el-icon><Promotion /></el-icon>
                发布
              </el-button>
            </el-button-group>
            <el-button size="small" type="danger" plain @click="handleDelete(survey)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>

        <div v-if="filteredSurveys.length === 0 && !loading" class="empty-state">
          <el-empty description="暂无问卷">
            <el-button type="primary" @click="handleCreate">立即创建</el-button>
          </el-empty>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 24px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.title-area {
  .main-title {
    font-size: 36px;
    font-weight: 700;
    color: white;
    margin: 0 0 8px 0;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  }

  .subtitle {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.9);
    margin: 0;
  }
}

.create-btn {
  padding: 16px 32px;
  font-size: 16px;
  border-radius: 12px;
  background: linear-gradient(135deg, #409EFF, #66b1ff);
  border: none;
  box-shadow: 0 4px 20px rgba(64, 158, 255, 0.4);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 24px rgba(64, 158, 255, 0.5);
  }
}

.filter-section {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;

  .search-input {
    width: 300px;
  }
}

.survey-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 24px;
}

.survey-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;

  .survey-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
    flex: 1;
    margin-right: 12px;
  }
}

.survey-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 16px 0;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.survey-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);

  .meta-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--text-secondary);
  }
}

.card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  .el-button-group {
    display: flex;
  }
}

.empty-state {
  grid-column: 1 / -1;
  padding: 60px 0;
}
</style>
