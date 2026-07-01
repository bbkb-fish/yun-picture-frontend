<template>
  <div class="space-detail-page">
    <!-- 空间信息头部 -->
    <div class="space-header">
      <div class="space-info">
        <div class="space-title-row">
          <h2>{{ space?.spaceName ?? '加载中...' }}</h2>
          <el-button circle size="small" @click="openEditDialog">
            <el-icon><Edit /></el-icon>
          </el-button>
        </div>
        <div class="space-meta">
          <el-tag :type="getLevelTagType(space?.spaceLevel)" :class="getLevelTagClass(space?.spaceLevel)" size="large">
            {{ getLevelText(space?.spaceLevel) }}
          </el-tag>
          <span class="meta-text">
            容量 {{ formatSize(space?.totalSize) }} / {{ formatSize(space?.maxSize) }}
          </span>
          <span class="meta-text">
            数量 {{ space?.totalCount ?? 0 }} / {{ space?.maxCount ?? 0 }}
          </span>
        </div>
      </div>
      <el-button type="primary" @click="showUpload = true">
        <el-icon><Plus /></el-icon> 上传图片
      </el-button>
    </div>

    <!-- 图片网格 -->
    <div class="picture-grid" v-loading="loading">
      <div v-if="!loading && pictures.length === 0" class="empty-wrapper">
        <el-empty description="空间暂无图片">
          <el-button type="primary" @click="showUpload = true">上传第一张图片</el-button>
        </el-empty>
      </div>
      <router-link
        v-for="pic in pictures"
        :key="pic.id"
        :to="`/picture/${pic.id}`"
        class="picture-card"
      >
        <div class="card-image-box">
          <img :src="pic.thumbnailUrl || pic.url" :alt="pic.name" class="card-image" />
        </div>
        <div class="card-body">
          <div class="card-title">{{ pic.name || '未命名' }}</div>
          <div class="card-tags">
            <el-tag
              v-for="tag in pic.tags?.slice(0, 3)"
              :key="tag"
              size="small"
              class="card-tag"
            >
              {{ tag }}
            </el-tag>
            <span v-if="!pic.tags?.length" class="no-tag">暂无标签</span>
          </div>
        </div>
      </router-link>
    </div>

    <!-- 分页 -->
    <div class="pagination-container" v-if="total > pageSize">
      <el-pagination
        background
        layout="prev, pager, next"
        :total="Number(total)"
        :page-size="pageSize"
        :current-page="current"
        @current-change="onPageChange"
      />
    </div>

    <!-- 上传对话框 -->
    <el-dialog v-model="showUpload" title="上传图片到空间" width="520px" destroy-on-close>
      <PictureUpload :space-id="spaceId" @uploaded="onUploaded" />
    </el-dialog>

    <!-- 编辑空间名称对话框 -->
    <el-dialog v-model="showEditDialog" title="修改空间名称" width="420px" destroy-on-close>
      <el-form :model="editForm" label-position="top">
        <el-form-item label="空间名称">
          <el-input v-model="editForm.spaceName" placeholder="请输入空间名称" maxlength="50" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveSpaceName">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { Plus, Edit } from '@element-plus/icons-vue'
import { listPictureVoByPageUsingPost } from '@/services/api/pictureController'
import { getSpaceVoByIdUsingGet, listSpaceLevelUsingGet, editSpaceUsingPost } from '@/services/api/spaceController'
import { ElMessage } from 'element-plus'
import PictureUpload from '@/components/PictureUpload.vue'

const route = useRoute()
const spaceId = route.params.id as string

const space = ref<API.SpaceVO | null>(null)
const pictures = ref<API.PictureVO[]>([])
const loading = ref(false)
const current = ref(1)
const total = ref(0)
const pageSize = ref(12)
const showUpload = ref(false)
const showEditDialog = ref(false)
const saving = ref(false)
const editForm = reactive({ spaceName: '' })

const spaceLevels = ref<API.SpaceLevel[]>([])

/** 字节转可读大小 */
function formatSize(bytes?: number) {
  if (!bytes) return '0 B'
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB'
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB'
  if (bytes >= 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return bytes + ' B'
}

function getLevelText(level?: number) {
  const item = spaceLevels.value.find((s) => s.value === level)
  return item?.text ?? (level !== undefined ? `级别 ${level}` : '未知')
}

function getLevelTagType(level?: number) {
  const map: Record<number, string> = { 0: '', 1: '', 2: 'warning' }
  return level !== undefined ? (map[level] ?? 'info') : 'info'
}

function getLevelTagClass(level?: number) {
  return level === 1 ? 'tag-purple' : ''
}

async function loadSpace() {
  try {
    const res = await getSpaceVoByIdUsingGet({ id: spaceId } as any)
    if (res.data.code === 0 && res.data.data) {
      space.value = res.data.data
    }
  } catch {
    // ignore
  }
}

async function loadPictures() {
  loading.value = true
  try {
    const res = await listPictureVoByPageUsingPost({
      current: current.value,
      pageSize: pageSize.value,
      sortField: 'createTime',
      sortOrder: 'desc',
      spaceId: spaceId as any,
    })
    if (res.data.code === 0 && res.data.data) {
      const page = res.data.data
      pictures.value = page.records ?? []
      total.value = page.total ?? 0
    }
  } catch {
    // ignore
  } finally {
    loading.value = false
  }
}

function onPageChange(page: number) {
  current.value = page
  loadPictures()
}

function onUploaded() {
  showUpload.value = false
  current.value = 1
  loadPictures()
}

function openEditDialog() {
  editForm.spaceName = space.value?.spaceName ?? ''
  showEditDialog.value = true
}

async function saveSpaceName() {
  if (!editForm.spaceName.trim()) {
    ElMessage.warning('空间名称不能为空')
    return
  }
  saving.value = true
  try {
    const res = await editSpaceUsingPost({
      id: spaceId as any,
      spaceName: editForm.spaceName.trim(),
    })
    if (res.data.code === 0) {
      ElMessage.success('空间名称已更新')
      showEditDialog.value = false
      await loadSpace()
    }
  } catch {
    // ignore
  } finally {
    saving.value = false
  }
}

// 监听路由参数变化（同一组件切换空间时）
watch(() => route.params.id, (newId) => {
  if (newId && newId !== spaceId) {
    location.reload()
  }
})

onMounted(async () => {
  // 加载空间级别列表
  try {
    const res = await listSpaceLevelUsingGet()
    if (res.data.code === 0 && res.data.data) {
      spaceLevels.value = res.data.data
    }
  } catch { /* ignore */ }
  await loadSpace()
  await loadPictures()
})
</script>

<style scoped>
.space-detail-page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.space-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: #fff;
  border-radius: 12px;
  padding: 24px 28px;
  margin-bottom: 24px;
  border: 1px solid #ebeef5;
}

.space-info h2 {
  margin: 0;
  font-size: 22px;
  color: #303133;
}

.space-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.space-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.meta-text {
  font-size: 14px;
  color: #909399;
}

/* 图片网格 */
.picture-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.empty-wrapper {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  padding: 80px 0;
  background: #fff;
  border-radius: 12px;
}

.picture-card {
  display: block;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
  border: 1px solid #ebeef5;
  text-decoration: none;
  color: inherit;
}

.picture-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.card-image-box {
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: #f5f5f5;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.picture-card:hover .card-image {
  transform: scale(1.05);
}

.card-body {
  padding: 12px 14px 14px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 8px;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-height: 24px;
}

.card-tag {
  margin: 0;
}

.no-tag {
  color: #c0c4cc;
  font-size: 12px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 32px;
  padding-bottom: 20px;
}

.pagination-container :deep(.el-pager li) {
  min-width: 36px;
  height: 36px;
  border-radius: 50%;
  font-weight: 700;
  font-size: 14px;
  background: #fce4ec;
  border: 2px solid transparent;
  color: #e91e63;
  transition: all 0.3s ease;
}

.pagination-container :deep(.el-pager li:hover) {
  color: #fff;
  background: linear-gradient(135deg, #ff6b9d, #ce93d8);
  border-color: #ff6b9d;
  transform: translateY(-3px);
  box-shadow: 0 6px 18px rgba(255, 107, 157, 0.4);
}

.pagination-container :deep(.el-pager li.is-active) {
  background: linear-gradient(135deg, #ff6b9d, #ab47bc);
  border-color: #e91e63;
  color: #fff;
  box-shadow: 0 0 0 4px rgba(233, 30, 99, 0.15), 0 6px 18px rgba(233, 30, 99, 0.35);
  transform: scale(1.1);
}

.pagination-container :deep(.btn-prev),
.pagination-container :deep(.btn-next) {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #fce4ec;
  border: 2px solid transparent;
  color: #e91e63;
  font-weight: 700;
  font-size: 16px;
  transition: all 0.3s ease;
}

.pagination-container :deep(.btn-prev:hover),
.pagination-container :deep(.btn-next:hover) {
  color: #fff;
  background: linear-gradient(135deg, #ff6b9d, #ce93d8);
  border-color: #ff6b9d;
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 6px 18px rgba(255, 107, 157, 0.4);
}

.pagination-container :deep(.btn-prev.is-disabled),
.pagination-container :deep(.btn-next.is-disabled) {
  background: #fafafa;
  color: #c0c4cc;
  border-color: transparent;
  box-shadow: none;
  transform: none;
}

/* 紫色标签 */
:deep(.tag-purple.el-tag) {
  background-color: #f3e5f5;
  border-color: #ce93d8;
  color: #7b1fa2;
}
:deep(.tag-purple.el-tag--dark) {
  background-color: #9c27b0;
  border-color: #9c27b0;
  color: #fff;
}
</style>
