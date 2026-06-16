<template>
  <div class="detail-page">
    <div class="detail-card" v-loading="loading">
      <!-- 返回按钮 -->
      <div class="back-row">
        <el-button text @click="$router.back()">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
      </div>

      <div v-if="picture" class="detail-body">
        <!-- 左侧：图片预览 -->
        <div class="detail-image-box">
          <el-image
            :src="picture.url"
            :preview-src-list="[picture.originUrl || picture.url]"
            :alt="picture.name"
            fit="cover"
            preview-teleported
            class="detail-image"
          />
        </div>

        <!-- 右侧：信息区 -->
        <div class="detail-info">
          <h2 class="detail-title">{{ picture.name || '未命名' }}</h2>

          <!-- 下载按钮 -->
          <div class="download-actions">
            <el-button type="primary" :loading="downloading" @click="handleDownload('normal')">
              <el-icon><Download /></el-icon>
              下载图片
            </el-button>
            <el-button v-if="loginUserStore.isAdmin" type="warning" :loading="downloading" @click="handleDownload('high')">
              <el-icon><Download /></el-icon>
              下载原图
            </el-button>
          </div>

          <div class="info-block">
            <span class="info-label">简介</span>
            <p class="info-value">{{ picture.introduction || '暂无简介' }}</p>
          </div>

          <div class="info-block">
            <span class="info-label">分类</span>
            <span class="info-value">
              <el-tag v-if="picture.category" size="small" type="primary">{{ picture.category }}</el-tag>
              <span v-else class="text-muted">未分类</span>
            </span>
          </div>

          <div class="info-block">
            <span class="info-label">标签</span>
            <div class="tag-list" v-if="picture.tags?.length">
              <el-tag v-for="tag in picture.tags" :key="tag" size="small" class="detail-tag">{{ tag }}</el-tag>
            </div>
            <span v-else class="text-muted">暂无标签</span>
          </div>

          <div class="info-block">
            <span class="info-label">作者</span>
            <span class="info-value">{{ picture.user?.userName ?? '未知用户' }}</span>
          </div>

          <div class="info-block">
            <span class="info-label">图片信息</span>
            <div class="meta-grid">
              <div class="meta-item">
                <span class="meta-label">格式</span>
                <span class="meta-val">{{ picture.picFormat ?? '-' }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">尺寸</span>
                <span class="meta-val">{{ picture.picWidth }} × {{ picture.picHeight }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">宽高比</span>
                <span class="meta-val">{{ picture.picScale ?? '-' }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">大小</span>
                <span class="meta-val">{{ formatSize(picture.picSize) }}</span>
              </div>
            </div>
          </div>

          <!-- 审核信息（仅管理员可见） -->
          <div class="info-block" v-if="loginUserStore.isAdmin">
            <span class="info-label">审核状态</span>
            <div class="review-row">
              <el-tag v-if="picture.reviewStatus === 0" type="warning" size="small">待审核</el-tag>
              <el-tag v-else-if="picture.reviewStatus === 1" type="success" size="small">已通过</el-tag>
              <el-tag v-else-if="picture.reviewStatus === 2" type="danger" size="small">已拒绝</el-tag>
              <span v-else class="text-muted">-</span>
              <el-button
                v-if="picture.reviewStatus !== 2"
                type="danger"
                size="small"
                :loading="reviewing"
                @click="openRejectDialog()"
              >拒绝</el-button>
            </div>
            <div v-if="picture.reviewMessage" class="review-msg">
              <span class="review-msg-label">审核意见：</span>{{ picture.reviewMessage }}
            </div>
          </div>

          <div class="info-block" v-if="picture.createTime">
            <span class="info-label">创建时间</span>
            <span class="info-value">{{ formatTime(picture.createTime) }}</span>
          </div>
        </div>
      </div>

      <el-empty v-else-if="!loading" description="图片不存在" />
    </div>

    <!-- 拒绝原因对话框 -->
    <el-dialog v-model="rejectVisible" title="拒绝原因" width="420px" :close-on-click-modal="false">
      <el-input
        v-model="rejectMessage"
        type="textarea"
        :rows="3"
        placeholder="请输入拒绝原因（可选）"
        maxlength="200"
        show-word-limit
      />
      <template #footer>
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button type="danger" :loading="reviewing" @click="doReview(2)">确认拒绝</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, Download } from '@element-plus/icons-vue'
import { getPictureVoByIdUsingGet, reviewPictureUsingPost } from '@/services/api/pictureController'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import { ElMessage } from 'element-plus'

const route = useRoute()
const loginUserStore = useLoginUserStore()
const picture = ref<API.PictureVO | null>(null)
const loading = ref(false)
const reviewing = ref(false)
const rejectVisible = ref(false)
const rejectMessage = ref('')
const downloading = ref(false)

function formatSize(bytes?: number): string {
  if (bytes === undefined || bytes === null) return '-'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function formatTime(time?: string): string {
  if (!time) return '-'
  const d = new Date(time)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

async function loadDetail() {
  const id = route.params.id as string
  if (!id) return
  loading.value = true
  try {
    const res = await getPictureVoByIdUsingGet({ id } as any)
    if (res.data.code === 0 && res.data.data) {
      picture.value = res.data.data
    }
  } catch {
    // 静默
  } finally {
    loading.value = false
  }
}

onMounted(() => loadDetail())

function openRejectDialog() {
  rejectMessage.value = ''
  rejectVisible.value = true
}

async function doReview(status: 0 | 1 | 2) {
  const id = route.params.id as string
  if (!id) return
  reviewing.value = true
  try {
    const res = await reviewPictureUsingPost({
      id,
      reviewStatus: status,
      reviewMessage: status === 2 ? rejectMessage.value : undefined,
    })
    if (res.data.code === 0) {
      ElMessage.success(status === 1 ? '已通过' : '已拒绝')
      rejectVisible.value = false
      await loadDetail()
    } else {
      ElMessage.error(res.data.message || '操作失败')
    }
  } catch {
    ElMessage.error('操作失败')
  } finally {
    reviewing.value = false
  }
}

/** 下载图片: normal=缩略图, high=原图（仅管理员） */
async function handleDownload(type: 'normal' | 'high') {
  if (!picture.value?.id) return
  downloading.value = true
  try {
    const res = await fetch(`http://localhost:8123/api/picture/download/${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: picture.value.id, fileName: picture.value.name }),
      credentials: 'include',
    })
    if (!res.ok) {
      ElMessage.error('下载失败')
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = picture.value.name || 'image'
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('下载成功')
  } catch {
    ElMessage.error('下载失败，请检查网络')
  } finally {
    downloading.value = false
  }
}
</script>

<style scoped>
.detail-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 16px 20px 40px;
}

.detail-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #ebeef5;
}

.back-row {
  margin-bottom: 20px;
}

.detail-body {
  display: flex;
  gap: 32px;
}

/* 左侧图片 */
.detail-image-box {
  flex: 0 0 400px;
  border-radius: 12px;
  overflow: hidden;
  background: #f5f5f5;
  align-self: flex-start;
}

.detail-image {
  width: 100%;
  display: block;
}

/* 右侧信息 */
.detail-info {
  flex: 1;
  min-width: 0;
}

.detail-title {
  font-size: 22px;
  font-weight: 700;
  color: #303133;
  margin: 0 0 16px 0;
}

/* 下载按钮区 */
.download-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.info-block {
  margin-bottom: 20px;
}

.info-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #909399;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.info-value {
  font-size: 14px;
  color: #303133;
}

.text-muted {
  color: #c0c4cc;
  font-size: 13px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.detail-tag {
  margin: 0;
}

/* 图片信息小网格 */
.meta-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.meta-item {
  background: #f9fafb;
  border-radius: 8px;
  padding: 10px 14px;
}

.meta-label {
  display: block;
  font-size: 11px;
  color: #909399;
  margin-bottom: 2px;
}

.meta-val {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

/* 审核信息 */
.review-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.review-btns {
  display: flex;
  gap: 8px;
  margin-left: 4px;
}

.review-msg {
  margin-top: 8px;
  padding: 8px 12px;
  background: #fdf6ec;
  border-radius: 6px;
  font-size: 13px;
  color: #e6a23c;
}

.review-msg-label {
  font-weight: 600;
}

/* 图片预览器 - 对齐到顶部 */
:deep(.el-image-viewer__canvas) {
  align-items: flex-start;
  padding-top: 20px;
}

:deep(.el-image-viewer__wrapper) {
  z-index: 3000 !important;
}
@media (max-width: 768px) {
  .detail-body {
    flex-direction: column;
  }
  .detail-image-box {
    flex: none;
    width: 100%;
  }
}
</style>
