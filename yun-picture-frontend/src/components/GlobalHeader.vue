<template>
  <header id="globalHeader">
    <div class="header-inner">
      <!-- 左侧：Logo -->
      <router-link to="/" class="logo-col">
        <img src="/logo.png" alt="云图库" class="logo-img" />
        <span class="logo-text">云图库</span>
      </router-link>

      <!-- 宽屏：水平导航 -->
      <nav class="main-nav" v-if="isWide">
        <router-link to="/" class="nav-item" :class="{ active: activeIndex === '/' }">
          <el-icon><HomeFilled /></el-icon>
          <span>主页</span>
        </router-link>
        <router-link to="/add/picture" class="nav-item" :class="{ active: activeIndex === '/add/picture' }">
          <span>创建图片</span>
        </router-link>
        <span v-if="loginUserStore.isLoggedIn" class="nav-item" :class="{ active: activeIndex.startsWith('/space/') }" @click="goToMySpace">
          <span>我的空间</span>
        </span>
        <router-link v-if="loginUserStore.isAdmin" to="/admin/userManage" class="nav-item" :class="{ active: activeIndex === '/admin/userManage' }">
          <span>用户管理</span>
        </router-link>
        <router-link v-if="loginUserStore.isAdmin" to="/admin/pictureManage" class="nav-item" :class="{ active: activeIndex === '/admin/pictureManage' }">
          <span>管理图片</span>
        </router-link>
        <router-link v-if="loginUserStore.isAdmin" to="/admin/spaceManage" class="nav-item" :class="{ active: activeIndex === '/admin/spaceManage' }">
          <span>空间管理</span>
        </router-link>
      </nav>

      <!-- 窄屏：汉堡按钮 -->
      <div class="hamburger-btn" v-if="!isWide" @click="drawerVisible = true">
        <el-icon :size="22"><Menu /></el-icon>
      </div>

      <!-- 右侧：用户区 -->
      <div class="user-col">
        <template v-if="loginUserStore.isLoggedIn">
          <el-dropdown trigger="click" @command="handleCommand">
            <span class="user-trigger">
              <el-avatar :src="loginUserStore.loginUser.userAvatar" :size="32" class="user-avatar">
                {{ loginUserStore.loginUser.userName?.charAt(0) ?? 'U' }}
              </el-avatar>
              <span class="user-name">{{ loginUserStore.loginUser.userName ?? 'yunUser' }}</span>
              <el-icon class="arrow"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon> 个人中心
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon> 退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <el-button v-else type="primary" size="small" round @click="router.push('/user/login')">
          登录
        </el-button>
      </div>
    </div>

    <!-- 侧边抽屉（窄屏） -->
    <el-drawer v-model="drawerVisible" direction="ltr" size="260px" :with-header="false">
      <div class="drawer-head">
        <img src="/logo.png" alt="logo" class="drawer-logo" />
        <span class="drawer-title">云图库</span>
      </div>
      <nav class="drawer-nav">
        <router-link to="/" class="drawer-item" @click="drawerVisible = false">
          <el-icon><HomeFilled /></el-icon> 主页
        </router-link>
        <router-link to="/add/picture" class="drawer-item" @click="drawerVisible = false">创建图片</router-link>
        <router-link to="/user/profile" class="drawer-item" @click="drawerVisible = false">
          <el-icon><User /></el-icon> 个人中心
        </router-link>
        <span v-if="loginUserStore.isLoggedIn" class="drawer-item" @click="drawerVisible = false; goToMySpace()">我的空间</span>
        <router-link v-if="loginUserStore.isAdmin" to="/admin/userManage" class="drawer-item" @click="drawerVisible = false">用户管理</router-link>
        <router-link v-if="loginUserStore.isAdmin" to="/admin/pictureManage" class="drawer-item" @click="drawerVisible = false">管理图片</router-link>
        <router-link v-if="loginUserStore.isAdmin" to="/admin/spaceManage" class="drawer-item" @click="drawerVisible = false">空间管理</router-link>
      </nav>
    </el-drawer>
  </header>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import { listSpaceVoByPageUsingPost, addSpaceUsingPost } from '@/services/api/spaceController'

const loginUserStore = useLoginUserStore()
const router = useRouter()
const route = useRoute()
const activeIndex = ref(route.path)
const drawerVisible = ref(false)

const isWide = ref(window.innerWidth > 768)
function onResize() { isWide.value = window.innerWidth > 768 }
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

const handleCommand = async (command: string) => {
  if (command === 'logout') {
    try {
      await loginUserStore.logout()
      ElMessage.success('已退出登录')
      router.push('/')
    } catch {
      loginUserStore.loginUser = { userName: '未登录', id: -1 }
      router.push('/')
    }
  } else if (command === 'profile') {
    router.push('/user/profile')
  }
}

watch(() => route.path, (p) => { activeIndex.value = p }, { immediate: true })

/** 跳转到"我的空间"——无空间则自动创建 */
async function goToMySpace() {
  const userId = loginUserStore.loginUser.id
  if (!userId || userId === -1) {
    ElMessage.warning('请先登录')
    return
  }
  // 查询用户是否已有空间
  try {
    const res = await listSpaceVoByPageUsingPost({ userId, current: 1, pageSize: 1 })
    if (res.data.code === 0 && res.data.data?.records?.length) {
      const space = res.data.data.records[0]
      router.push(`/space/${space.id}`)
      return
    }
  } catch { /* 查询失败则尝试创建 */ }

  // 无空间，自动创建
  try {
    const name = (loginUserStore.loginUser.userName || '用户') + '的私有空间'
    const createRes = await addSpaceUsingPost({ spaceName: name })
    if (createRes.data.code === 0 && createRes.data.data) {
      ElMessage.success('已为你创建私有空间')
      router.push(`/space/${createRes.data.data}`)
    } else {
      ElMessage.error(createRes.data.message || '创建空间失败')
    }
  } catch {
    ElMessage.error('创建空间失败')
  }
}
</script>

<style scoped>
#globalHeader {
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-inner {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  height: 56px;
  display: flex;
  align-items: center;
  gap: 32px;
}

/* ====== Logo ====== */
.logo-col {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  flex-shrink: 0;
}

.logo-img {
  height: 32px;
  width: 32px;
  border-radius: 8px;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 1px;
}

/* ====== 导航 ====== */
.main-nav {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  justify-content: center;
}

.nav-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  font-size: 14px;
  font-weight: 500;
  color: #555;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.2s;
  cursor: pointer;
  user-select: none;
}

.nav-item:hover {
  color: #667eea;
  background: rgba(102, 126, 234, 0.06);
}

.nav-item.active {
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  font-weight: 600;
}

/* ====== 右侧用户 ====== */
.user-col {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.user-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 10px 4px 4px;
  border-radius: 20px;
  transition: background 0.2s;
}

.user-trigger:hover {
  background: #f5f5f5;
}

.user-avatar {
  flex-shrink: 0;
}

.user-name {
  font-size: 13px;
  color: #333;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.arrow {
  color: #999;
  font-size: 12px;
}

/* ====== 窄屏汉堡 ====== */
.hamburger-btn {
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  color: #555;
  margin-left: auto;
}

.hamburger-btn:hover { background: #f5f5f5; }

/* ====== 抽屉 ====== */
.drawer-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 20px 16px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 8px;
}

.drawer-logo {
  height: 32px;
  width: 32px;
  border-radius: 8px;
}

.drawer-title {
  font-size: 18px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.drawer-nav {
  display: flex;
  flex-direction: column;
  padding: 0 12px;
}

.drawer-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  font-size: 15px;
  color: #555;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.15s;
  cursor: pointer;
  user-select: none;
}

.drawer-item:hover {
  color: #667eea;
  background: rgba(102, 126, 234, 0.06);
}

/* ==================== 响应式 ==================== */
@media (max-width: 768px) {
  .header-inner {
    padding: 0 16px;
    height: 52px;
    gap: 0;
  }

  .logo-text { font-size: 17px; }
  .logo-img { height: 28px; width: 28px; }
}
</style>
