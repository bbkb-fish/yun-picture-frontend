<template>
  <div class="admin-manage-page">
    <div class="page-header">
      <h2>空间管理</h2>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="空间名称">
          <el-input
            v-model="searchForm.spaceName"
            placeholder="请输入空间名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="用户 ID">
          <el-input
            v-model="searchForm.userId"
            placeholder="请输入用户ID"
            clearable
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item label="空间级别">
          <el-select v-model="searchForm.spaceLevel" placeholder="全部" clearable style="width: 140px">
            <el-option
              v-for="item in spaceLevels"
              :key="item.value"
              :label="item.text"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 空间表格 -->
    <div class="table-container">
      <el-table
        :data="tableData"
        border
        stripe
        v-loading="loading"
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="spaceName" label="空间名称" min-width="140" />
        <el-table-column label="空间级别" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getLevelTagType(row.spaceLevel)" :class="getLevelTagClass(row.spaceLevel)">{{ getLevelText(row.spaceLevel) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="容量" min-width="140">
          <template #default="{ row }">
            {{ formatSize(row.totalSize) }} / {{ formatSize(row.maxSize) }}
          </template>
        </el-table-column>
        <el-table-column label="数量" width="110" align="center">
          <template #default="{ row }">
            {{ row.totalCount ?? 0 }} / {{ row.maxCount ?? 0 }}
          </template>
        </el-table-column>
        <el-table-column label="所属用户" min-width="140">
          <template #default="{ row }">
            <div v-if="row.user" class="user-cell">
              <el-avatar :size="28" :src="row.user.userAvatar" />
              <span style="margin-left: 8px">{{ row.user.userName }}（{{ row.user.userAccount }}）</span>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-popconfirm
              title="确定要删除该空间吗？"
              confirm-button-text="确定"
              cancel-button-text="取消"
              @confirm="handleDelete(row)"
            >
              <template #reference>
                <el-button type="danger" size="small">
                  删除
                </el-button>
              </template>
            </el-popconfirm>
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
    <el-dialog v-model="editDialogVisible" title="编辑空间" width="480px" @close="handleDialogClose">
      <el-form :model="editForm" label-width="90px">
        <el-form-item label="空间名称">
          <el-input v-model="editForm.spaceName" placeholder="请输入空间名称" />
        </el-form-item>
        <el-form-item label="空间级别">
          <el-select v-model="editForm.spaceLevel" placeholder="请选择空间级别" style="width: 100%">
            <el-option
              v-for="item in spaceLevels"
              :key="item.value"
              :label="item.text"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="最大容量">
          <el-input-number v-model="editForm.maxSize" :min="0" :step="1048576" placeholder="最大容量（字节）" style="width: 100%" />
        </el-form-item>
        <el-form-item label="最大数量">
          <el-input-number v-model="editForm.maxCount" :min="0" placeholder="最大数量" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleUpdate" :loading="updating">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { listSpaceVoByPageUsingPost, deleteSpaceUsingPost, listSpaceLevelUsingGet, updateSpaceUsingPost } from '@/services/api/spaceController'

/** 时间格式化: yyyy-MM-dd HH:mm:ss */
function formatTime(time?: string) {
  if (!time) return '-'
  const d = new Date(time)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/** 字节转可读大小 */
function formatSize(bytes?: number) {
  if (!bytes) return '0 B'
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB'
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB'
  if (bytes >= 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return bytes + ' B'
}

// 空间级别列表
const spaceLevels = ref<API.SpaceLevel[]>([])

/** 根据空间级别获取标签颜色 */
function getLevelTagType(level?: number) {
  // 0=普通(蓝) 1=高级(紫) 2=旗舰(黄)
  const map: Record<number, string> = { 0: '', 1: '', 2: 'warning' }
  return level !== undefined ? (map[level] ?? 'info') : 'info'
}

/** 根据空间级别获取自定义样式类 */
function getLevelTagClass(level?: number) {
  return level === 1 ? 'tag-purple' : ''
}
function getLevelText(level?: number) {
  const item = spaceLevels.value.find((s) => s.value === level)
  return item?.text ?? (level !== undefined ? `级别 ${level}` : '未知')
}

// 搜索表单
const searchForm = reactive<API.SpaceQueryDTO>({
  spaceName: '',
  userId: undefined,
  spaceLevel: undefined,
})

// 分页
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
})

// 表格数据
const tableData = ref<API.SpaceVO[]>([])
const loading = ref(false)

// 加载空间级别
async function loadSpaceLevels() {
  try {
    const res = await listSpaceLevelUsingGet()
    if (res.data.code === 0 && res.data.data) {
      spaceLevels.value = res.data.data
    }
  } catch {
    // ignore
  }
}

// 加载空间列表
async function loadSpaces() {
  loading.value = true
  try {
    const res = await listSpaceVoByPageUsingPost({
      current: pagination.current,
      pageSize: pagination.pageSize,
      spaceName: searchForm.spaceName || undefined,
      userId: searchForm.userId ? Number(searchForm.userId) : undefined,
      spaceLevel: searchForm.spaceLevel ?? undefined,
    })
    if (res.data.code === 0 && res.data.data) {
      const page = res.data.data
      tableData.value = page.records ?? []
      pagination.total = page.total ?? 0
      pagination.current = page.current ?? 1
      pagination.pageSize = page.size ?? 10
    } else {
      ElMessage.error(res.data.message || '获取空间列表失败')
    }
  } catch {
    ElMessage.error('获取空间列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
function handleSearch() {
  pagination.current = 1
  loadSpaces()
}

// 重置
function handleReset() {
  searchForm.spaceName = ''
  searchForm.userId = undefined
  searchForm.spaceLevel = undefined
  pagination.current = 1
  loadSpaces()
}

// 删除空间
async function handleDelete(row: API.SpaceVO) {
  if (!row.id) return
  const res = await deleteSpaceUsingPost({ id: row.id })
  if (res.data.code === 0) {
    ElMessage.success('删除成功')
    if (tableData.value.length === 1 && pagination.current > 1) {
      pagination.current--
    }
    loadSpaces()
  } else {
    ElMessage.error(res.data.message || '删除失败')
  }
}

// --- 编辑对话框 ---
const editDialogVisible = ref(false)
const updating = ref(false)
const editForm = reactive<API.SpaceUpdateDTO>({
  id: undefined,
  spaceName: '',
  spaceLevel: undefined,
  maxSize: undefined,
  maxCount: undefined,
})

function handleEdit(row: API.SpaceVO) {
  editForm.id = row.id
  editForm.spaceName = row.spaceName ?? ''
  editForm.spaceLevel = row.spaceLevel
  editForm.maxSize = row.maxSize
  editForm.maxCount = row.maxCount
  editDialogVisible.value = true
}

async function handleUpdate() {
  if (!editForm.id) return
  updating.value = true
  try {
    const res = await updateSpaceUsingPost({ ...editForm })
    if (res.data.code === 0) {
      ElMessage.success('更新成功')
      editDialogVisible.value = false
      loadSpaces()
    } else {
      ElMessage.error(res.data.message || '更新失败')
    }
  } catch {
    ElMessage.error('更新失败')
  } finally {
    updating.value = false
  }
}

function handleDialogClose() {
  editForm.id = undefined
  editForm.spaceName = ''
  editForm.spaceLevel = undefined
  editForm.maxSize = undefined
  editForm.maxCount = undefined
}

// 分页切换
function onPageChange(page: number) {
  pagination.current = page
  loadSpaces()
}

onMounted(() => {
  loadSpaceLevels()
  loadSpaces()
})
</script>

<style scoped>
.admin-manage-page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
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
  padding: 0;
  overflow: hidden;
}

.user-cell {
  display: flex;
  align-items: center;
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

/* 紫色标签 - 高级空间 */
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
