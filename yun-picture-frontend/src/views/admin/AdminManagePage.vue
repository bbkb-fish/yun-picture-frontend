<template>
  <div class="admin-manage-page">
    <div class="page-header">
      <h2>用户管理</h2>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="用户名">
          <el-input
            v-model="searchForm.userName"
            placeholder="请输入用户名"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="账号">
          <el-input
            v-model="searchForm.userAccount"
            placeholder="请输入账号"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 用户表格 -->
    <div class="table-container">
      <el-table
        :data="tableData"
        border
        stripe
        v-loading="loading"
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column label="头像" width="80" align="center">
          <template #default="{ row }">
            <el-avatar :size="40" :src="row.userAvatar" />
          </template>
        </el-table-column>
        <el-table-column prop="userName" label="用户名" min-width="120" />
        <el-table-column prop="userAccount" label="账号" min-width="120" />
        <el-table-column prop="userProfile" label="简介" min-width="160" show-overflow-tooltip />
        <el-table-column prop="userRole" label="角色" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.userRole === 'admin' ? 'danger' : 'info'">
              {{ row.userRole === 'admin' ? '管理员' : '普通用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="{ row }">
            <el-popconfirm
              title="确定要删除该用户吗？"
              confirm-button-text="确定"
              cancel-button-text="取消"
              @confirm="handleDelete(row)"
            >
              <template #reference>
                <el-button type="danger" size="small" :disabled="row.userRole === 'admin'">
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { listUserPageQueryUsingPost, deleteUserUsingPost } from '@/services/api/userController'

/** 时间格式化: yyyy-MM-dd HH:mm:ss */
function formatTime(time?: string) {
  if (!time) return '-'
  const d = new Date(time)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// 搜索表单
const searchForm = reactive<API.UserQueryDTO>({
  userName: '',
  userAccount: '',
})

// 分页
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
})

// 表格数据
const tableData = ref<API.UserVO[]>([])
const loading = ref(false)

// 加载用户列表
async function loadUsers() {
  loading.value = true
  try {
    const res = await listUserPageQueryUsingPost({
      current: pagination.current,
      pageSize: pagination.pageSize,
      userName: searchForm.userName || undefined,
      userAccount: searchForm.userAccount || undefined,
    })
    if (res.data.code === 0 && res.data.data) {
      const page = res.data.data
      tableData.value = page.records ?? []
      pagination.total = page.total ?? 0
      pagination.current = page.current ?? 1
      pagination.pageSize = page.size ?? 10
    } else {
      ElMessage.error(res.data.message || '获取用户列表失败')
    }
  } catch {
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
function handleSearch() {
  pagination.current = 1
  loadUsers()
}

// 重置
function handleReset() {
  searchForm.userName = ''
  searchForm.userAccount = ''
  pagination.current = 1
  loadUsers()
}

// 删除用户
async function handleDelete(row: API.UserVO) {
  if (!row.id) return
  const res = await deleteUserUsingPost({ id: row.id })
  if (res.data.code === 0) {
    ElMessage.success('删除成功')
    // 如果当前页删空了，回退一页
    if (tableData.value.length === 1 && pagination.current > 1) {
      pagination.current--
    }
    loadUsers()
  } else {
    ElMessage.error(res.data.message || '删除失败')
  }
}

// 分页切换
function onPageChange(page: number) {
  pagination.current = page
  loadUsers()
}

function handleSizeChange() {
  pagination.current = 1
  loadUsers()
}

onMounted(() => {
  loadUsers()
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
</style>
