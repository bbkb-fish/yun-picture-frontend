<template>
  <div class="member-form-wrap">
    <div class="member-form-inner">
      <!-- Logo -->
      <div class="member-form-head">
        <a class="member-form-logo" href="/">
          <span class="logo-text">云图片</span>
        </a>
      </div>

      <!-- 标题 + 登录入口 -->
      <div class="member-form-title">
        <h3>注册</h3>
        <span class="member-switch">
          已有账号？
          <router-link to="/user/login">立即登录</router-link>
        </span>
      </div>

      <!-- 错误提示 -->
      <div v-if="errMsg" class="wpcom-errmsg wpcom-alert alert-danger">
        {{ errMsg }}
      </div>

      <!-- 表单 -->
      <el-form
        ref="ruleFormRef"
        :model="ruleForm"
        :rules="rules"
        label-width="0"
        class="member-form"
        @submit.prevent="submitForm(ruleFormRef)"
      >
        <!-- 账号 -->
        <el-form-item prop="account" class="form-group">
          <label>
            <i class="form-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </i>
            <el-input
              v-model="ruleForm.account"
              class="form-input"
              placeholder="请设置您的用户名"
              clearable
            />
          </label>
        </el-form-item>

        <!-- 密码 -->
        <el-form-item prop="pass" class="form-group">
          <label>
            <i class="form-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z"/>
              </svg>
            </i>
            <el-input
              v-model="ruleForm.pass"
              class="form-input"
              type="password"
              placeholder="请设置登录密码（不少于8位）"
              show-password
              clearable
            />
          </label>
        </el-form-item>

        <!-- 确认密码 -->
        <el-form-item prop="checkPass" class="form-group">
          <label>
            <i class="form-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z"/>
              </svg>
            </i>
            <el-input
              v-model="ruleForm.checkPass"
              class="form-input"
              type="password"
              placeholder="请再次输入登录密码"
              show-password
              clearable
            />
          </label>
        </el-form-item>

        <!-- 注册按钮 -->
        <el-button
          type="primary"
          class="login-btn"
          :loading="loading"
          @click="submitForm(ruleFormRef)"
        >
          注册
        </el-button>
      </el-form>
    </div>

    <!-- 返回首页 -->
    <a href="/" class="btn-home">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
      </svg>
      返回首页
    </a>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { userRegisterUsingPost } from '@/services/api/userController'

const router = useRouter()

const ruleFormRef = ref<FormInstance>()
const loading = ref(false)
const errMsg = ref('')

// 表单数据
const ruleForm = reactive({
  account: '',
  pass: '',
  checkPass: '',
})

// 验证账号
const validateAccount = (_rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请输入账号'))
  } else if (value.length < 4) {
    callback(new Error('账号长度不能少于4位'))
  } else {
    callback()
  }
}

// 验证密码
const validatePass = (_rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请输入密码'))
  } else if (value.length < 8) {
    callback(new Error('密码长度不能少于8位'))
  } else {
    callback()
  }
}

// 验证确认密码
const validateCheckPass = (_rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== ruleForm.pass) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

// 表单验证规则
const rules = reactive<FormRules<typeof ruleForm>>({
  account: [{ validator: validateAccount, trigger: 'blur' }],
  pass: [{ validator: validatePass, trigger: 'blur' }],
  checkPass: [{ validator: validateCheckPass, trigger: 'blur' }],
})

// 提交表单
const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return

  errMsg.value = ''

  await formEl.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const res = await userRegisterUsingPost({
          userAccount: ruleForm.account,
          userPassword: ruleForm.pass,
          checkPassword: ruleForm.checkPass,
        })
        if (res.data.code === 0) {
          ElMessage.success('注册成功！请登录')
          router.replace('/user/login')
        } else {
          errMsg.value = res.data.message || '注册失败，请稍后重试'
        }
      } catch (error: any) {
        errMsg.value = error?.response?.data?.message || '网络错误，请稍后重试'
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
/* ====== 整体容器 ====== */
.member-form-wrap {
  box-sizing: border-box;
  margin: 60px auto;
  max-width: 410px;
  padding: 50px 25px;
  position: relative;
  text-align: left;
  width: 100%;
}

.member-form-inner {
  width: 100%;
}

/* ====== Logo ====== */
.member-form-head {
  margin-bottom: 40px;
  text-align: center;
}

.member-form-logo {
  display: inline-block;
  height: 40px;
  line-height: 40px;
  max-width: 300px;
  text-decoration: none;
}

.logo-text {
  font-size: 22px;
  font-weight: 700;
  color: #206be7;
  letter-spacing: 1px;
}

/* ====== 标题 ====== */
.member-form-title {
  margin: 0 0 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.member-form-title h3 {
  border: 0 !important;
  color: #333 !important;
  display: inline-block;
  font-size: 16px !important;
  font-weight: 500 !important;
  margin: 0 !important;
  padding: 0 !important;
  line-height: 24px;
}

.member-switch {
  color: #666;
  flex-shrink: 0;
  font-size: 14px;
  font-weight: 400;
  line-height: 24px;
  text-align: right;
}

.member-switch a {
  color: #206be7;
  text-decoration: none;
}

.member-switch a:hover {
  color: #1162e8;
}

/* ====== 错误提示 ====== */
.wpcom-errmsg {
  border-radius: 4px;
  font-size: 13px;
  line-height: 20px;
  margin-bottom: 20px;
  display: block;
}

.alert-danger {
  background-color: #fee;
  border: 1px solid #ffe9e9;
  color: #fa5555;
  padding: 12px 15px;
}

/* ====== 表单 ====== */
.member-form .form-group {
  margin-bottom: 20px;
  position: relative;
}

.member-form .form-group label {
  margin: 0;
  width: 100%;
  position: relative;
  display: block;
}

.form-icon {
  color: #999;
  font-size: 18px;
  left: 0;
  height: 40px;
  position: absolute;
  top: 0;
  width: 46px;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

/* 重置 Element Plus 的 form-item 样式 */
:deep(.el-form-item) {
  margin-bottom: 0;
}

:deep(.el-form-item__error) {
  padding-left: 0;
  font-size: 12px;
}

/* ====== 输入框 ====== */
.form-input :deep(.el-input__wrapper) {
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  box-shadow: none !important;
  height: 40px;
  padding-left: 42px;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.form-input :deep(.el-input__wrapper:hover) {
  border-color: #b3b3b3;
}

.form-input :deep(.el-input__wrapper.is-focus) {
  border-color: #206be7;
}

.form-input :deep(.el-input__inner) {
  height: 38px;
  line-height: 38px;
  font-size: 14px;
  color: #333;
}

.form-input :deep(.el-input__inner::placeholder) {
  color: #bbb;
}

/* 显示密码切换图标 */
.form-input :deep(.el-input__suffix) {
  right: 6px;
}

.form-input :deep(.el-input__suffix .el-icon) {
  color: #999;
  font-size: 16px;
}

/* 清除按钮 */
.form-input :deep(.el-input__clear) {
  color: #bbb;
}

/* ====== 注册按钮 ====== */
.login-btn {
  width: 100%;
  height: 42px;
  font-size: 14px;
  font-weight: 400;
  border-radius: 4px;
  background-color: #206be7;
  border-color: #206be7;
  letter-spacing: 2px;
}

.login-btn:hover {
  background-color: #1a5cc4;
  border-color: #1a5cc4;
}

.login-btn :deep(.el-icon) {
  font-size: 16px;
}

/* ====== 返回首页 ====== */
.btn-home {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 30px;
  color: #999;
  font-size: 14px;
  text-decoration: none;
  transition: color 0.2s;
}

.btn-home:hover {
  color: #206be7;
}

.btn-home svg {
  flex-shrink: 0;
}

/* ====== 响应式 ====== */
@media (max-width: 767px) {
  .member-form-wrap {
    margin: 20px auto !important;
    max-width: none !important;
    width: auto !important;
    padding: 30px 20px;
  }
}
</style>
