<template>
  <div class="picture-manage-page">
    <div class="page-header">
      <h2>图片管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="$router.push('/add/picture')">
          <el-icon><Plus /></el-icon>
          创建图片
        </el-button>
        <el-button type="success" @click="$router.push('/upload/batch')">
          <el-icon><MagicStick /></el-icon>
          关键词创建图片
        </el-button>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="图片名称">
          <el-input
            v-model="searchForm.name"
            placeholder="请输入图片名称"
            clearable
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item label="搜索文本">
          <el-input
            v-model="searchForm.searchText"
            placeholder="搜索名称/简介/标签"
            clearable
            style="width: 220px"
          />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="searchForm.category" placeholder="全部分类" clearable style="width: 150px">
            <el-option
              v-for="cat in categoryOptions"
              :key="cat"
              :label="cat"
              :value="cat"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="审核状态">
          <el-select v-model="searchForm.reviewStatus" placeholder="全部" clearable style="width: 120px">
            <el-option label="待审核" :value="0" />
            <el-option label="已通过" :value="1" />
            <el-option label="已拒绝" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 图片表格 -->
    <div class="table-container">
      <el-table
        :data="tableData"
        border
        stripe
        v-loading="loading"
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column label="缩略图" width="100" align="center">
          <template #default="{ row }">
            <el-image
              :src="row.url"
              :preview-src-list="[row.url]"
              preview-teleported
              fit="cover"
              style="width: 60px; height: 60px; border-radius: 6px"
            />
          </template>
        </el-table-column>
        <el-table-column prop="name" label="图片名称" min-width="140" show-overflow-tooltip />
        <el-table-column label="分类" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.category" size="small">{{ row.category }}</el-tag>
            <span v-else style="color: #999">无</span>
          </template>
        </el-table-column>
        <el-table-column label="标签" min-width="160">
          <template #default="{ row }">
            <template v-if="row.tags">
              <el-tag
                v-for="tag in parseTags(row.tags)"
                :key="tag"
                size="small"
                style="margin-right: 4px; margin-bottom: 2px"
              >
                {{ tag }}
              </el-tag>
            </template>
            <span v-else style="color: #999">无</span>
          </template>
        </el-table-column>
        <el-table-column label="图片信息" width="200" align="center">
          <template #default="{ row }">
            <div class="picture-info-cell">
              <span>{{ row.picFormat?.toUpperCase() ?? '-' }}</span>
              <span v-if="row.picWidth && row.picHeight">{{ row.picWidth }}×{{ row.picHeight }}</span>
              <span v-if="row.picSize">{{ formatSize(row.picSize) }}</span>
              <span v-if="row.picScale !== undefined && row.picScale !== null">比例{{ row.picScale }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="introduction" label="简介" min-width="140" show-overflow-tooltip />
        <el-table-column prop="userId" label="创建用户ID" width="110" align="center" />
        <el-table-column label="审核信息" align="center">
          <el-table-column label="审核状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.reviewStatus === 0" type="warning" size="small">待审核</el-tag>
              <el-tag v-else-if="row.reviewStatus === 1" type="success" size="small">已通过</el-tag>
              <el-tag v-else-if="row.reviewStatus === 2" type="danger" size="small">已拒绝</el-tag>
              <span v-else style="color: #999">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="reviewerId" label="审核人" width="90" align="center">
            <template #default="{ row }">
              <span v-if="row.reviewerId">{{ row.reviewerId }}</span>
              <span v-else style="color: #999">-</span>
            </template>
          </el-table-column>
          <el-table-column label="拒绝原因" min-width="140" show-overflow-tooltip align="center">
            <template #default="{ row }">
              <span v-if="row.reviewMessage">{{ row.reviewMessage }}</span>
              <span v-else style="color: #999">-</span>
            </template>
          </el-table-column>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="170" align="center">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" align="center" fixed="right">
          <template #default="{ row }">
            <div class="action-cell">
              <div class="action-row">
                <el-button
                  v-if="row.reviewStatus !== 1"
                  type="success"
                  size="small"
                  link
                  @click="handleReview(row, 1)"
                >通过</el-button>
                <el-button
                  v-if="row.reviewStatus !== 2"
                  type="danger"
                  size="small"
                  link
                  @click="openRejectDialog(row)"
                >拒绝</el-button>
              </div>
              <div class="action-row">
                <el-button type="primary" size="small" link @click="handleEdit(row)">编辑</el-button>
                <el-popconfirm
                  title="确定要删除该图片吗？"
                  confirm-button-text="确定"
                  cancel-button-text="取消"
                  @confirm="handleDelete(row)"
                >
                  <template #reference>
                    <el-button type="danger" size="small" link>删除</el-button>
                  </template>
                </el-popconfirm>
              </div>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        background
        layout="prev, pager, next"
        :total="Number(pagination.total)"
        :page-size="pagination.pageSize"
        :current-page="pagination.current"
        @current-change="onPageChange"
      />
    </div>

    <!-- 编辑对话框 -->
    <el-dialog v-model="editDialogVisible" title="编辑图片信息" width="520px" :close-on-click-modal="false">
      <el-form :model="editForm" label-position="top">
        <el-form-item label="图片名称">
          <el-input v-model="editForm.name" placeholder="请输入图片名称" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="简介">
          <el-input
            v-model="editForm.introduction"
            type="textarea"
            :rows="3"
            placeholder="简单描述一下这张图片"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="editForm.category" placeholder="请选择分类" clearable allow-create filterable style="width: 100%">
            <el-option v-for="cat in categoryOptions" :key="cat" :label="cat" :value="cat" />
          </el-select>
        </el-form-item>
        <el-form-item label="标签">
          <div class="tag-input-container">
            <el-tag
              v-for="(tag, i) in editForm.tags"
              :key="i"
              closable
              class="tag-item"
              @close="editForm.tags.splice(i, 1)"
            >
              {{ tag }}
            </el-tag>
            <el-input
              v-if="editTagInputVisible"
              ref="editTagInputRef"
              v-model="editTagInputValue"
              class="tag-input"
              size="small"
              placeholder="输入标签名，回车添加"
              @keyup.enter="handleAddEditTag"
              @blur="handleAddEditTag"
            />
            <el-button v-else class="add-tag-btn" size="small" @click="showEditTagInput">
              + 添加标签
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="editing" @click="handleSaveEdit">保存</el-button>
      </template>
    </el-dialog>
    <!-- 拒绝原因对话框 -->
    <el-dialog v-model="rejectDialogVisible" title="拒绝原因" width="420px" :close-on-click-modal="false">
      <el-form>
        <el-form-item label="拒绝原因（选填）">
          <el-input
            v-model="rejectMessage"
            type="textarea"
            :rows="3"
            placeholder="请输入拒绝原因..."
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" :loading="reviewing" @click="handleRejectConfirm">确认拒绝</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { listPictureByPageUsingPost, deletePictureUsingPost, editPictureUsingPost, reviewPictureUsingPost, listPictureTagCategoryUsingGet } from '@/services/api/pictureController'

/** 时间格式化: yyyy-MM-dd HH:mm:ss */
function formatTime(time?: string) {
  if (!time) return '-'
  const d = new Date(time)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// 搜索表单
const searchForm = reactive<API.PictureQueryDTO>({
  name: '',
  searchText: '',
  category: '',
  reviewStatus: undefined,
})

// 分类选项
const categoryOptions = ref<string[]>([])

// 分页
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
})

// 表格数据
const tableData = ref<API.Picture[]>([])
const loading = ref(false)

// 加载图片列表
async function loadPictures() {
  loading.value = true
  try {
    const res = await listPictureByPageUsingPost({
      current: pagination.current,
      pageSize: pagination.pageSize,
      sortField: 'createTime',
      sortOrder: 'desc',
      name: searchForm.name || undefined,
      searchText: searchForm.searchText || undefined,
      category: searchForm.category || undefined,
      reviewStatus: searchForm.reviewStatus !== undefined && searchForm.reviewStatus !== null
        ? searchForm.reviewStatus
        : undefined,
    })
    if (res.data.code === 0 && res.data.data) {
      const page = res.data.data
      tableData.value = page.records ?? []
      pagination.total = page.total ?? 0
      pagination.current = page.current ?? 1
      pagination.pageSize = page.size ?? 10
    } else {
      ElMessage.error(res.data.message || '获取图片列表失败')
    }
  } catch {
    ElMessage.error('获取图片列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
function handleSearch() {
  pagination.current = 1
  loadPictures()
}

// 重置
function handleReset() {
  searchForm.name = ''
  searchForm.searchText = ''
  searchForm.category = ''
  searchForm.reviewStatus = undefined
  pagination.current = 1
  loadPictures()
}

// 删除图片
async function handleDelete(row: API.Picture) {
  if (!row.id) return
  const res = await deletePictureUsingPost({ id: row.id })
  if (res.data.code === 0) {
    ElMessage.success('删除成功')
    if (tableData.value.length === 1 && pagination.current > 1) {
      pagination.current--
    }
    loadPictures()
  } else {
    ElMessage.error(res.data.message || '删除失败')
  }
}

// 分页切换
function onPageChange(page: number) {
  pagination.current = page
  loadPictures()
}

function handleSizeChange() {
  pagination.current = 1
  loadPictures()
}

// 加载分类选项
async function loadCategories() {
  try {
    const res = await listPictureTagCategoryUsingGet()
    if (res.data.code === 0 && res.data.data) {
      categoryOptions.value = res.data.data.categoryList ?? []
    }
  } catch {
    // 静默失败
  }
}

// ========== 审核 ==========
const reviewing = ref(false)
const rejectDialogVisible = ref(false)
const rejectMessage = ref('')
const rejectTargetId = ref<number>()

// 审核通过
async function handleReview(row: API.Picture, status: number) {
  if (!row.id) return
  reviewing.value = true
  try {
    const res = await reviewPictureUsingPost({ id: row.id, reviewStatus: status })
    if (res.data.code === 0) {
      ElMessage.success(status === 1 ? '审核通过' : '已拒绝')
      loadPictures()
    } else {
      ElMessage.error(res.data.message || '审核失败')
    }
  } catch {
    ElMessage.error('审核失败')
  } finally {
    reviewing.value = false
  }
}

// 打开拒绝对话框
function openRejectDialog(row: API.Picture) {
  rejectTargetId.value = row.id
  rejectMessage.value = ''
  rejectDialogVisible.value = true
}

// 确认拒绝（带原因）
async function handleRejectConfirm() {
  if (!rejectTargetId.value) return
  reviewing.value = true
  try {
    const res = await reviewPictureUsingPost({
      id: rejectTargetId.value,
      reviewStatus: 2,
      reviewMessage: rejectMessage.value || undefined,
    })
    if (res.data.code === 0) {
      ElMessage.success('已拒绝')
      rejectDialogVisible.value = false
      loadPictures()
    } else {
      ElMessage.error(res.data.message || '拒绝失败')
    }
  } catch {
    ElMessage.error('拒绝失败')
  } finally {
    reviewing.value = false
  }
}

onMounted(() => {
  loadCategories()
  loadPictures()
})

// 格式化图片大小
function formatSize(bytes?: number) {
  if (!bytes) return '-'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// 解析 tags 字符串为数组（后端存的是 JSON 或逗号分隔字符串）
function parseTags(tags: string): string[] {
  if (!tags) return []
  try {
    const arr = JSON.parse(tags)
    if (Array.isArray(arr)) return arr
  } catch {}
  return tags.split(',').map(t => t.trim()).filter(Boolean)
}

// ========== 编辑 ==========
const editDialogVisible = ref(false)
const editing = ref(false)
const editForm = reactive<API.PictureEditDTO>({
  id: undefined,
  name: '',
  introduction: '',
  category: '',
  tags: [],
})
const editTagInputVisible = ref(false)
const editTagInputValue = ref('')
const editTagInputRef = ref<any>(null)

function handleEdit(row: API.Picture) {
  editForm.id = row.id
  editForm.name = row.name ?? ''
  editForm.introduction = row.introduction ?? ''
  editForm.category = row.category ?? ''
  editForm.tags = row.tags ? parseTags(row.tags) : []
  editDialogVisible.value = true
}

function showEditTagInput() {
  editTagInputVisible.value = true
  nextTick(() => editTagInputRef.value?.focus())
}

function handleAddEditTag() {
  const val = editTagInputValue.value.trim()
  if (val && !editForm.tags?.includes(val)) {
    editForm.tags!.push(val)
  }
  editTagInputValue.value = ''
  editTagInputVisible.value = false
}

async function handleSaveEdit() {
  if (!editForm.id) return
  editing.value = true
  try {
    const res = await editPictureUsingPost({
      id: editForm.id,
      name: editForm.name,
      introduction: editForm.introduction,
      category: editForm.category,
      tags: editForm.tags,
    })
    if (res.data.code === 0) {
      ElMessage.success('保存成功')
      editDialogVisible.value = false
      loadPictures()
    } else {
      ElMessage.error(res.data.message || '保存失败')
    }
  } catch {
    ElMessage.error('保存失败')
  } finally {
    editing.value = false
  }
}
</script>

<style scoped>
.picture-manage-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.search-bar {
  background: #fff;
  padding: 20px 24px 4px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.search-form .el-form-item {
  margin-bottom: 16px;
}

.table-container {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.pagination-container {
  display: flex;
  justify-content: center;
  background: #fff;
  padding: 16px 24px;
  margin-top: 16px;
  border-radius: 8px;
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

/* 图片信息单元格 */
.picture-info-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  color: #606266;
}

/* 标签编辑 */
.tag-input-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
.tag-item {
  margin: 0;
}
.tag-input {
  width: 140px;
}
.add-tag-btn {
  font-size: 12px;
}

/* 操作列布局 */
.action-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.action-row {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 图片预览器 - 对齐到顶部 */
:deep(.el-image-viewer__canvas) {
  align-items: flex-start;
  padding-top: 20px;
}

/* 确保图片预览器在所有元素之上 */
:deep(.el-image-viewer__wrapper) {
  z-index: 3000 !important;
}
</style>
