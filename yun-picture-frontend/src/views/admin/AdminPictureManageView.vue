<template>
  <div class="picture-manage-page">
    <div class="page-header">
      <h2>图片管理</h2>
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
        <el-table-column prop="createTime" label="创建时间" width="170" align="center">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="{ row }">
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
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.current"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[5, 10, 20, 50]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { listPictureByPageUsingPost, deletePictureUsingPost, editPictureUsingPost, listPictureTagCategoryUsingGet } from '@/services/api/pictureController'

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
      name: searchForm.name || undefined,
      searchText: searchForm.searchText || undefined,
      category: searchForm.category || undefined,
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
function handleCurrentChange() {
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
  overflow: hidden;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  background: #fff;
  padding: 16px 24px;
  margin-top: 16px;
  border-radius: 8px;
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
</style>
