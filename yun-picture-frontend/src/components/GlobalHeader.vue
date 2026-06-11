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
        </el-menu>
      </el-col>
      <el-col :span="3">
        <div class="user-login-status">
          <div v-if="loginUserStore.loginUser.id !== -1">
            {{ loginUserStore.loginUser.userName ?? "yunUser" }}
          </div>
          <div v-else>
            <el-button type="primary" @click="router.push('/user/login')">登录</el-button>
          </div>
        </div></el-col
      >
    </el-row>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useLoginUserStore } from "@/stores/useLoginUserStore";
const loginUserStore = useLoginUserStore();
const router = useRouter();
const route = useRoute();
const activeIndex = ref(route.path);
const handleSelect = (key: string) => {
  router.push(key);
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
</style>
