import { createRouter, createWebHistory } from 'vue-router'

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

export default router
