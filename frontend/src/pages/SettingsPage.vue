<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSurveyStore } from '@/stores/survey'
import { surveyApi } from '@/utils/api'
import { ElMessage } from 'element-plus'
import QRCode from 'qrcode'

const route = useRoute()
const router = useRouter()
const store = useSurveyStore()
const loading = ref(false)
const saving = ref(false)
const surveyId = computed(() => route.params.id as string)

const form = ref({
  title: '',
  description: '',
  welcomeMessage: '',
  endMessage: '',
  startTime: null as string | null,
  endTime: null as string | null,
  maxResponses: null as number | null,
  isAnonymous: true
})

const qrCodeUrl = ref('')
const shareUrl = computed(() => `${window.location.origin}/fill/${surveyId.value}`)

onMounted(async () => {
  await loadSurvey()
  generateQRCode()
})

async function loadSurvey() {
  loading.value = true
  try {
    const data = await surveyApi.get(surveyId.value)
    store.setCurrentSurvey(data)
    form.value = {
      title: data.title,
      description: data.description,
      welcomeMessage: data.welcomeMessage,
      endMessage: data.endMessage,
      startTime: data.startTime,
      endTime: data.endTime,
      maxResponses: data.maxResponses,
      isAnonymous: data.isAnonymous
    }
  } catch (error: any) {
    ElMessage.error('加载失败')
    router.push('/')
  } finally {
    loading.value = false
  }
}

async function generateQRCode() {
  try {
    qrCodeUrl.value = await QRCode.toDataURL(shareUrl.value, {
      width: 200,
      margin: 2
    })
  } catch (error) {
    console.error('QR code generation failed:', error)
  }
}

async function saveSettings() {
  saving.value = true
  try {
    await surveyApi.update(surveyId.value, form.value)
    ElMessage.success('保存成功')
  } catch (error: any) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

async function handlePublish() {
  try {
    await saveSettings()
    await surveyApi.publish(surveyId.value)
    store.updateSurveyInList(surveyId.value, { status: 'published' })
    ElMessage.success('发布成功！问卷已开始收集')
    router.push('/')
  } catch (error: any) {
    ElMessage.error('发布失败')
  }
}

function copyLink() {
  navigator.clipboard.writeText(shareUrl.value)
  ElMessage.success('链接已复制到剪贴板')
}
</script>

<template>
  <div class="settings-page">
    <header class="page-header">
      <el-button @click="router.push(`/editor/${surveyId}`)">
        <el-icon><Back /></el-icon>
        返回
      </el-button>
      <h2>问卷设置</h2>
      <el-button type="primary" :loading="saving" @click="saveSettings">
        保存设置
      </el-button>
    </header>

    <div v-loading="loading" class="settings-content">
      <div class="settings-section">
        <h3 class="section-title">基本信息</h3>
        <div class="form-item">
          <label>问卷标题</label>
          <el-input v-model="form.title" placeholder="请输入问卷标题" />
        </div>
        <div class="form-item">
          <label>问卷描述</label>
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="简要描述问卷内容" />
        </div>
      </div>

      <div class="settings-section">
        <h3 class="section-title">提示信息</h3>
        <div class="form-item">
          <label>欢迎语</label>
          <el-input v-model="form.welcomeMessage" type="textarea" :rows="2" placeholder="填写问卷前显示的欢迎信息" />
        </div>
        <div class="form-item">
          <label>结束语</label>
          <el-input v-model="form.endMessage" type="textarea" :rows="2" placeholder="提交后显示的感谢信息" />
        </div>
      </div>

      <div class="settings-section">
        <h3 class="section-title">收集设置</h3>
        <div class="form-row">
          <div class="form-item">
            <label>开始时间</label>
            <el-date-picker
              v-model="form.startTime"
              type="datetime"
              placeholder="选择开始时间"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DDTHH:mm:ss"
            />
          </div>
          <div class="form-item">
            <label>结束时间</label>
            <el-date-picker
              v-model="form.endTime"
              type="datetime"
              placeholder="选择结束时间"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DDTHH:mm:ss"
            />
          </div>
        </div>
        <div class="form-item">
          <label>每人填写次数</label>
          <el-input-number v-model="form.maxResponses" :min="1" placeholder="留空表示不限" />
        </div>
        <div class="form-item">
          <label>匿名填写</label>
          <el-switch v-model="form.isAnonymous" />
        </div>
      </div>

      <div v-if="store.currentSurvey?.status === 'draft'" class="settings-section share-section">
        <h3 class="section-title">发布问卷</h3>
        <div class="share-card">
          <div class="qrcode-area">
            <img v-if="qrCodeUrl" :src="qrCodeUrl" alt="二维码" class="qrcode" />
            <p>手机扫码填写</p>
          </div>
          <div class="share-link">
            <p>分享链接</p>
            <el-input :model-value="shareUrl" readonly>
              <template #append>
                <el-button @click="copyLink">复制</el-button>
              </template>
            </el-input>
          </div>
        </div>
        <div class="publish-action">
          <el-button type="success" size="large" @click="handlePublish">
            <el-icon><Promotion /></el-icon>
            立即发布
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.settings-page {
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

.settings-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

.settings-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;

  .section-title {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 20px 0;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border-color);
  }
}

.form-item {
  margin-bottom: 20px;

  label {
    display: block;
    font-size: 14px;
    color: var(--text-regular);
    margin-bottom: 8px;
  }
}

.form-row {
  display: flex;
  gap: 16px;

  .form-item {
    flex: 1;
  }
}

.share-section {
  .share-card {
    display: flex;
    gap: 32px;
    align-items: flex-start;
    margin-bottom: 24px;
  }

  .qrcode-area {
    text-align: center;

    .qrcode {
      width: 160px;
      height: 160px;
      border-radius: 8px;
      box-shadow: var(--shadow-light);
    }

    p {
      margin: 12px 0 0 0;
      font-size: 13px;
      color: var(--text-secondary);
    }
  }

  .share-link {
    flex: 1;

    p {
      margin: 0 0 8px 0;
      font-size: 14px;
      color: var(--text-regular);
    }
  }

  .publish-action {
    text-align: center;
    padding-top: 24px;
    border-top: 1px dashed var(--border-color);

    .el-button {
      padding: 16px 48px;
      font-size: 16px;
    }
  }
}
</style>
