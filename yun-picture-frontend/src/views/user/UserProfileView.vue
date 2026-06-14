<template>
  <div class="profile-page">
    <div class="profile-card" v-loading="loading">
      <!-- 左侧：用户卡片 -->
      <div class="profile-sidebar">
        <el-avatar :src="user.userAvatar" :size="80" class="profile-avatar">
          {{ (user.userName ?? 'U').charAt(0) }}
        </el-avatar>
        <h2 class="profile-name">{{ user.userName ?? '未知用户' }}</h2>
        <p class="profile-account">@{{ user.userAccount ?? '-' }}</p>
        <el-tag :type="user.userRole === 'admin' ? 'danger' : ''" size="small">
          {{ user.userRole === 'admin' ? '管理员' : '普通用户' }}
        </el-tag>
        <div class="sidebar-info">
          <div class="sidebar-item">
            <span class="sidebar-label">简介</span>
            <p>{{ user.userProfile || '这个人很懒，什么都没写~' }}</p>
          </div>
        </div>
        <el-button type="primary" style="width: 100%; margin-top: 16px" @click="editMode = !editMode">
          {{ editMode ? '取消编辑' : '编辑资料' }}
        </el-button>
      </div>

      <!-- 右侧：信息 / 编辑 -->
      <div class="profile-main">
        <template v-if="!editMode">
          <!-- 查看模式 -->
          <div class="info-section">
            <h3 class="section-title">基本信息</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">用户名</span>
                <span class="info-value">{{ user.userName ?? '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">账号</span>
                <span class="info-value">{{ user.userAccount ?? '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">角色</span>
                <span class="info-value">
                  <el-tag :type="user.userRole === 'admin' ? 'danger' : ''" size="small">
                    {{ user.userRole === 'admin' ? '管理员' : '普通用户' }}
                  </el-tag>
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">注册时间</span>
                <span class="info-value">{{ user.createTime ?? '-' }}</span>
              </div>
            </div>
          </div>
          <div class="info-section">
            <h3 class="section-title">个人简介</h3>
            <p class="profile-text">{{ user.userProfile || '暂无简介' }}</p>
          </div>
        </template>

        <template v-else>
          <!-- 编辑模式 -->
          <h3 class="section-title">编辑资料</h3>
          <el-form :model="form" label-width="80px" class="edit-form">
            <el-form-item label="用户名">
              <el-input v-model="form.userName" placeholder="请输入用户名" maxlength="32" show-word-limit />
            </el-form-item>
            <el-form-item label="头像URL">
              <el-input v-model="form.userAvatar" placeholder="请输入头像链接" />
            </el-form-item>
            <el-form-item label="个人简介">
              <el-input
                v-model="form.userProfile"
                type="textarea"
                :rows="5"
                placeholder="介绍一下自己..."
                maxlength="200"
                show-word-limit
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="saving" @click="handleSave">保存修改</el-button>
              <el-button @click="editMode = false">取消</el-button>
            </el-form-item>
          </el-form>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getUserVoByIdUsingGet, updateUserUsingPost } from '@/services/api/userController'
import { useLoginUserStore } from '@/stores/useLoginUserStore'

const loginUserStore = useLoginUserStore()
const user = ref<API.UserVO>({})
const loading = ref(false)
const saving = ref(false)
const editMode = ref(false)

const form = reactive<API.UserUpdateDTO>({
  userName: '',
  userAvatar: '',
  userProfile: '',
})

async function loadUser() {
  const uid = loginUserStore.loginUser.id
  if (!uid || uid === -1) return
  loading.value = true
  try {
    const res = await getUserVoByIdUsingGet({ id: uid } as any)
    if (res.data.code === 0 && res.data.data) {
      user.value = res.data.data
      form.userName = user.value.userName ?? ''
      form.userAvatar = user.value.userAvatar ?? ''
      form.userProfile = user.value.userProfile ?? ''
    }
  } catch {
    ElMessage.error('加载用户信息失败')
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  saving.value = true
  try {
    const res = await updateUserUsingPost({
      id: loginUserStore.loginUser.id,
      userName: form.userName,
      userAvatar: form.userAvatar,
      userProfile: form.userProfile,
    } as any)
    if (res.data.code === 0) {
      ElMessage.success('资料更新成功')
      editMode.value = false
      // 刷新显示 & store
      await loadUser()
      await loginUserStore.fetchLoginUser()
    } else {
      ElMessage.error(res.data.message || '更新失败')
    }
  } catch {
    ElMessage.error('更新失败，请检查网络')
  } finally {
    saving.value = false
  }
}

onMounted(() => loadUser())
</script>

<style scoped>
.profile-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 16px 20px 40px;
}

.profile-card {
  display: flex;
  gap: 32px;
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  border: 1px solid #ebeef5;
}

/* 左侧 */
.profile-sidebar {
  flex: 0 0 220px;
  text-align: center;
  padding-right: 32px;
  border-right: 1px solid #f0f0f0;
}

.profile-avatar {
  margin-bottom: 12px;
}

.profile-name {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
  margin: 0 0 4px;
}

.profile-account {
  font-size: 13px;
  color: #909399;
  margin: 0 0 12px;
}

.sidebar-info {
  margin-top: 20px;
  text-align: left;
}

.sidebar-item {
  margin-bottom: 12px;
}

.sidebar-label {
  font-size: 12px;
  font-weight: 600;
  color: #909399;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sidebar-item p {
  font-size: 14px;
  color: #606266;
  margin: 4px 0 0;
  line-height: 1.5;
}

/* 右侧 */
.profile-main {
  flex: 1;
  min-width: 0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: #909399;
}

.info-value {
  font-size: 14px;
  color: #303133;
}

.profile-text {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
}

.edit-form {
  max-width: 440px;
}

/* 响应式 */
@media (max-width: 768px) {
  .profile-card {
    flex-direction: column;
    padding: 20px;
  }
  .profile-sidebar {
    flex: none;
    border-right: none;
    border-bottom: 1px solid #f0f0f0;
    padding-right: 0;
    padding-bottom: 20px;
  }
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
