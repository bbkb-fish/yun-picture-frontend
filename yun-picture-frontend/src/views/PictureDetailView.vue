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
          <img :src="picture.url" :alt="picture.name" class="detail-image" />
        </div>

        <!-- 右侧：信息区 -->
        <div class="detail-info">
          <h2 class="detail-title">{{ picture.name || '未命名' }}</h2>

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

          <div class="info-block" v-if="picture.createTime">
            <span class="info-label">创建时间</span>
            <span class="info-value">{{ picture.createTime }}</span>
          </div>
        </div>
      </div>

      <el-empty v-else-if="!loading" description="图片不存在" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { getPictureVoByIdUsingGet } from '@/services/api/pictureController'

const route = useRoute()
const picture = ref<API.PictureVO | null>(null)
const loading = ref(false)

function formatSize(bytes?: number): string {
  if (bytes === undefined || bytes === null) return '-'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
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
  margin: 0 0 24px 0;
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

/* 响应式 */
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
