import { createRouter, createWebHistory } from 'vue-router'
import { useLoginUserStore } from '@/stores/useLoginUserStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/MainView.vue'),
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/views/AboutView.vue'),
    },
    {
      path: '/info',
      name: 'info',
      component: () => import('@/views/InfoView.vue'),
    },
    {
      path: '/user/login',
      name: 'login',
      component: () => import('@/views/user/UserLoginView.vue'),
    },
    {
      path: '/user/register',
      name: 'register',
      component: () => import('@/views/user/UserRegisterView.vue'),
    },
    {
      path: '/admin/userManage',
      name: 'userManage',
      component: () => import('@/views/admin/AdminManagePage.vue'),
    }
  ],
})

router.beforeEach(async (to, _from, next) => {
  // 仅保护 /admin 开头的路由
  if (to.path.startsWith('/admin')) {
    const loginUserStore = useLoginUserStore()
    // 如果登录用户信息还未加载，先拉取
    if (loginUserStore.loginUser.id === -1) {
      await loginUserStore.fetchLoginUser()
    }
    if (!loginUserStore.isAdmin) {
      // 非管理员，跳回首页
      next('/')
      return
    }
  }
  next()
})

export default router
