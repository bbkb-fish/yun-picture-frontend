<template>
  <div id="globalHeader">
    <el-row class="row-bg" justify="space-between">
      <el-col :span="4">
        <router-link to="/">
          <div class="title-bar">
            <img src="../../public/logo.png" alt="logo" class="logo" />
            <div class="title">云图库</div>
          </div>
        </router-link>
      </el-col>
      <el-col :span="12">
        <el-menu
          :default-active="activeIndex"
          class="el-menu-demo"
          mode="horizontal"
          @select="handleSelect"
        >
          <el-menu-item index="/">
            <el-icon color="#409efc"> <HomeFilled /> </el-icon>
            主页
          </el-menu-item>
          <el-menu-item index="/about"> 关于 </el-menu-item>
          <el-menu-item index="/info"> 信息 </el-menu-item>
          <el-menu-item v-if="loginUserStore.isAdmin" index="/admin/userManage">
            用户管理
          </el-menu-item>
        </el-menu>
      </el-col>
      <el-col :span="3">
        <div class="user-login-status">
          <!-- 已登录：头像 + 下拉菜单 -->
          <el-dropdown v-if="loginUserStore.isLoggedIn" trigger="click" @command="handleCommand">
            <span class="user-info-dropdown">
              <el-avatar
                :src="loginUserStore.loginUser.userAvatar"
                :size="36"
                class="user-avatar"
              >
                {{ loginUserStore.loginUser.userName?.charAt(0) ?? "U" }}
              </el-avatar>
              <span class="user-name-text">{{
                loginUserStore.loginUser.userName ?? "yunUser"
              }}</span>
              <el-icon class="dropdown-arrow"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人中心
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <!-- 未登录：登录按钮 -->
          <div v-else>
            <el-button type="primary" @click="router.push('/user/login')">
              登录
            </el-button>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { useLoginUserStore } from "@/stores/useLoginUserStore";

const loginUserStore = useLoginUserStore();
const router = useRouter();
const route = useRoute();
const activeIndex = ref(route.path);

const handleSelect = (key: string) => {
  router.push(key);
};

const handleCommand = async (command: string) => {
  if (command === 'logout') {
    try {
      await loginUserStore.logout();
      ElMessage.success("已退出登录");
      router.push("/");
    } catch {
      // 即使接口失败也清理本地状态
      loginUserStore.loginUser = { userName: "未登录", id: -1 };
      router.push("/");
    }
  } else if (command === 'profile') {
    // TODO: 个人中心
  }
};

// 监听路由变化，更新激活状态
watch(
  () => route.path,
  (newPath) => {
    activeIndex.value = newPath;
  },
  { immediate: true },
);
</script>

<style scoped>
.logo-link {
  text-decoration: none;
  display: inline-block;
}

.title-bar {
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
}

.title {
  font-size: 20px;
  font-weight: 600;
  margin-left: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 添加悬停效果 */
.logo-link:hover .title {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.logo-link:hover .logo {
  transform: scale(1.05);
  transition: transform 0.3s ease;
}

.logo {
  height: 36px;
  transition: transform 0.3s ease;
}
.row-bg {
  display: flex;
  align-items: center;
}

/* ====== 用户头像区域 ====== */
.user-info-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.user-info-dropdown:hover {
  background-color: #f5f5f5;
}

.user-avatar {
  flex-shrink: 0;
}

.user-name-text {
  font-size: 14px;
  color: #333;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-arrow {
  color: #999;
  font-size: 12px;
  transition: transform 0.2s;
}

.user-info-dropdown:hover .dropdown-arrow {
  color: #666;
}
</style>
